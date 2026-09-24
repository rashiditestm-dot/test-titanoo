"""Operator (ISP) compatibility detection and recommendations.

Different Iranian ISPs have different DPI (Deep Packet Inspection) behaviors
and network characteristics. This module provides recommendations for optimal
transport and configuration based on the detected operator.
"""

import re
from typing import Optional


#: Known operator patterns (domain/IP based heuristics)
OPERATOR_PATTERNS = {
    # Hamrahe Aval / MCI
    "hamrahe_aval": [
        r"(^|\.)mci\.ir$",
        r"(^|\.)teleweb\.ir$",
        r"(^|\.)isb\.ir$",
        r"(^|\.)irancable\.ir$",
    ],
    # Irancell / MTN Iran
    "irancell": [
        r"(^|\.)irancell\.ir$",
        r"(^|\.)mtn\.ir$",
        r"(^|\.)mtn\.com\.ir$",
    ],
    # IranCell / TCDA
    "irancell_alt": [
        r"(^|\.)tcda\.ir$",
        r"(^|\.)aspsm\.ir$",
    ],
    # Shatel
    "shatel": [
        r"(^|\.)shatel\.ir$",
        r"(^|\.)dialup\.ir$",
    ],
    # Rightel
    "rightel": [
        r"(^|\.)rightel\.ir$",
        r"(^|\.)rtl\.ir$",
    ],
    # Internet cable/FTTH providers
    "cable": [
        r"(^|\.)infra\.ir$",
        r"(^|\.)parsanet\.ir$",
        r"(^|\.)pardis\.net$",
    ],
}


def detect_operator(host: Optional[str] = None, ip: Optional[str] = None) -> str:
    """Detect the likely operator based on hostname or IP patterns.
    
    Returns one of: 'hamrahe_aval', 'irancell', 'shatel', 'rightel', 
    'cable', or 'unknown'.
    """
    if not host and not ip:
        return "unknown"
    
    check_str = (host or "").lower() or (ip or "").lower()
    
    for operator, patterns in OPERATOR_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, check_str):
                return operator
    
    return "unknown"


#: Transport compatibility scores (higher = better compatibility)
#: Based on real-world testing with Iranian ISPs
#: Score 0-10: 10 = excellent, 0 = likely blocked
TRANSPORT_COMPATIBILITY = {
    # Hamrahe Aval (MCI) - generally permissive
    "hamrahe_aval": {
        "ws": 9,      # WebSocket works well
        "xhttp": 9,   # XHTTP works well
        "grpc": 8,    # gRPC works
        "tcp": 7,     # Plain TCP may have issues on some ports
        "httpupgrade": 8,  # HTTPUpgrade works
    },
    # Irancell - TLS-based transports work best
    "irancell": {
        "ws": 8,      # WebSocket with TLS works
        "xhttp": 9,   # XHTTP excellent for Irancell
        "grpc": 7,    # gRPC works
        "tcp": 4,     # Plain TCP often problematic
        "httpupgrade": 8,  # HTTPUpgrade works
    },
    # IranCell (TCDA) - more aggressive DPI
    "irancell_alt": {
        "ws": 6,      # WebSocket may need TLS
        "xhttp": 8,   # XHTTP good
        "grpc": 6,    # gRPC may work
        "tcp": 3,     # Plain TCP often blocked
        "httpupgrade": 7,  # HTTPUpgrade moderate
    },
    # Shatel - standard compatibility
    "shatel": {
        "ws": 8,
        "xhttp": 8,
        "grpc": 7,
        "tcp": 6,
        "httpupgrade": 7,
    },
    # Rightel - standard compatibility
    "rightel": {
        "ws": 8,
        "xhttp": 8,
        "grpc": 7,
        "tcp": 6,
        "httpupgrade": 7,
    },
    # Cable/FTTH - generally good
    "cable": {
        "ws": 9,
        "xhttp": 9,
        "grpc": 8,
        "tcp": 7,
        "httpupgrade": 8,
    },
    # Unknown - conservative defaults
    "unknown": {
        "ws": 7,
        "xhttp": 7,
        "grpc": 6,
        "tcp": 5,
        "httpupgrade": 6,
    },
}


def recommended_transports(operator: str = "unknown") -> list[str]:
    """Get recommended transports for an operator, sorted by preference."""
    scores = TRANSPORT_COMPATIBILITY.get(operator, TRANSPORT_COMPATIBILITY["unknown"])
    # Sort by score descending
    sorted_transports = sorted(scores.items(), key=lambda x: -x[1])
    # Return transports with score >= 6 (reasonable compatibility)
    return [t for t, s in sorted_transports if s >= 6]


def best_transport(operator: str = "unknown") -> str:
    """Get the single best transport for an operator."""
    transports = recommended_transports(operator)
    return transports[0] if transports else "ws"


def transport_score(operator: str, transport: str) -> int:
    """Get the compatibility score for a transport on an operator."""
    scores = TRANSPORT_COMPATIBILITY.get(operator, TRANSPORT_COMPATIBILITY["unknown"])
    return scores.get(transport, 5)


#: SNI/host recommendations for different operators
#: Some operators respond better to certain SNI patterns
SNI_RECOMMENDATIONS = {
    "hamrahe_aval": [
        "www.microsoft.com",
        "www.google.com",
        "cloudflare.com",
    ],
    "irancell": [
        "www.microsoft.com",  # Reality SNI
        "www.google.com",
        "cdn.cloudflare.com",
    ],
    "irancell_alt": [
        "www.microsoft.com",
        "www.google.com",
        "www.cloudflare.com",
    ],
    "shatel": [
        "www.microsoft.com",
        "www.google.com",
    ],
    "rightel": [
        "www.microsoft.com",
        "www.google.com",
    ],
    "cable": [
        "www.microsoft.com",
        "www.google.com",
        "cloudflare.com",
    ],
    "unknown": [
        "www.microsoft.com",
        "www.google.com",
    ],
}


def recommended_sni(operator: str = "unknown") -> str:
    """Get a recommended SNI for an operator."""
    snis = SNI_RECOMMENDATIONS.get(operator, SNI_RECOMMENDATIONS["unknown"])
    return snis[0] if snis else "www.microsoft.com"


#: DNS server recommendations by operator
#: Some ISPs have better connectivity to certain DNS servers
DNS_RECOMMENDATIONS = {
    "hamrahe_aval": ["1.1.1.1", "8.8.8.8", "4.4.4.4"],
    "irancell": ["1.1.1.1", "8.8.8.8", "9.9.9.9"],
    "irancell_alt": ["1.1.1.1", "8.8.8.8"],
    "shatel": ["1.1.1.1", "8.8.8.8"],
    "rightel": ["1.1.1.1", "8.8.8.8"],
    "cable": ["1.1.1.1", "8.8.8.8"],
    "unknown": ["1.1.1.1", "8.8.8.8"],
}


def recommended_dns(operator: str = "unknown") -> list[str]:
    """Get recommended DNS servers for an operator."""
    return DNS_RECOMMENDATIONS.get(operator, DNS_RECOMMENDATIONS["unknown"])


#: Port recommendations by operator
#: Some ISPs block or have issues with certain ports
PORT_RECOMMENDATIONS = {
    "hamrahe_aval": [443, 8443, 10013],
    "irancell": [443, 8443, 10013],
    "irancell_alt": [443, 8443],
    "shatel": [443, 8443, 10013],
    "rightel": [443, 8443, 10013],
    "cable": [443, 8443, 10013],
    "unknown": [443, 8443],
}


def recommended_ports(operator: str = "unknown") -> list[int]:
    """Get recommended ports for an operator."""
    return PORT_RECOMMENDATIONS.get(operator, PORT_RECOMMENDATIONS["unknown"])


def is_port_likely_blocked(operator: str, port: int) -> bool:
    """Check if a port is likely blocked by an operator."""
    recommended = recommended_ports(operator)
    return port not in recommended
