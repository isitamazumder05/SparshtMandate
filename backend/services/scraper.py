"""
SpashtMandate AI - Real-World Webpage Extraction Service
Supports Firecrawl API with resilient fallback to modern HTTP scraping & BeautifulSoup parsing.
Includes strict SSRF protection and security validations.
"""

import re
import ipaddress
import socket
from urllib.parse import urlparse
from datetime import datetime
from typing import Tuple, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from backend.config import settings

# Disallowed internal/private IP networks for SSRF protection
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"), # link-local
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10")
]

class ScrapeError(Exception):
    pass

def validate_url_safety(url: str) -> None:
    """Validates URL format and blocks private/local network targets (SSRF prevention)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ScrapeError(f"Invalid URL protocol: '{parsed.scheme}'. Only http and https are permitted.")
    
    hostname = parsed.hostname
    if not hostname:
        raise ScrapeError("URL hostname is empty or invalid.")
    
    if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        raise ScrapeError("Access to localhost is restricted for security.")

    try:
        # Resolve IP to check against private CIDR blocks
        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            for private_net in PRIVATE_NETWORKS:
                if ip_obj in private_net:
                    raise ScrapeError(f"Access to private IP address '{ip_str}' is forbidden.")
    except socket.gaierror:
        # DNS resolution failure will be caught on request
        pass

async def fetch_via_firecrawl(url: str, api_key: str) -> Optional[Dict[str, Any]]:
    """Attempts page extraction using Firecrawl API if key is available."""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "url": url,
            "formats": ["markdown", "html"],
            "onlyMainContent": True
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post("https://api.firecrawl.dev/v1/scrape", json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success") and "data" in data:
                    scrape_data = data["data"]
                    text_content = scrape_data.get("markdown") or scrape_data.get("content") or ""
                    title = scrape_data.get("metadata", {}).get("title", "")
                    return {
                        "text": text_content,
                        "title": title,
                        "source": "firecrawl"
                    }
    except Exception as e:
        # Fallback to direct fetch on any Firecrawl issue
        print(f"[Scraper] Firecrawl API attempt failed: {e}. Falling back to native scraper.")
    return None

async def fetch_webpage(url: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Fetches real webpage content, validates security, and extracts clean readable text.
    Returns: (cleaned_text, page_title, metadata)
    """
    validate_url_safety(url)
    
    # 1. Try Firecrawl if API key configured
    if settings.FIRECRAWL_API_KEY:
        fc_res = await fetch_via_firecrawl(url, settings.FIRECRAWL_API_KEY)
        if fc_res and fc_res.get("text"):
            return (
                fc_res["text"][:settings.MAX_CONTENT_LENGTH],
                fc_res.get("title", ""),
                {
                    "source": "firecrawl",
                    "timestamp": datetime.utcnow().isoformat(),
                    "url": url
                }
            )

    # 2. Resilient Native Scraper with modern browser headers
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    }
    
    try:
        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT_SECONDS,
            follow_redirects=True,
            verify=True
        ) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise ScrapeError(f"HTTP {resp.status_code}: Unable to access merchant page at '{url}'")
            
            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type and "text/plain" not in content_type and "application/xhtml" not in content_type:
                raise ScrapeError(f"Target page returned non-HTML content type: '{content_type}'")

            html_content = resp.text
    except httpx.TimeoutException:
        raise ScrapeError(f"Connection timed out after {settings.REQUEST_TIMEOUT_SECONDS}s while contacting '{url}'")
    except httpx.RequestError as exc:
        raise ScrapeError(f"Network error while connecting to merchant website: {str(exc)}")

    # 3. Parse and extract readable text using BeautifulSoup
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Extract Title
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    # Remove non-content tags
    for tag in soup(["script", "style", "noscript", "svg", "header", "footer", "aside"]):
        tag.decompose()

    # Extract clean text chunks
    text_pieces = []
    for element in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "span", "div", "td", "th"]):
        txt = element.get_text(separator=" ", strip=True)
        if txt and len(txt) > 3:
            # avoid duplicated huge container blobs
            if len(txt) < 1000:
                text_pieces.append(txt)

    # Deduplicate while preserving order
    seen = set()
    cleaned_chunks = []
    for piece in text_pieces:
        normalized = re.sub(r"\s+", " ", piece)
        if normalized not in seen:
            seen.add(normalized)
            cleaned_chunks.append(normalized)

    full_text = "\n".join(cleaned_chunks)
    if not full_text.strip():
        # Fallback to direct text
        full_text = soup.get_text(separator="\n", strip=True)

    return (
        full_text[:settings.MAX_CONTENT_LENGTH],
        title,
        {
            "source": "native_http_bs4",
            "timestamp": datetime.utcnow().isoformat(),
            "url": url,
            "status_code": resp.status_code
        }
    )
