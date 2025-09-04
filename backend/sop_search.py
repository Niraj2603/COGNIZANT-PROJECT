"""
SOP Keyword Search Module for IRENO Smart Assistant

This module provides keyword search functionality for SOP (Standard Operating Procedure) 
documents without relying on AI services. It performs text-based searches using various
matching strategies to find relevant content.

Usage:
    from sop_search import keyword_search, SOPSearchEngine
    
    # Simple function usage
    results = keyword_search("power outage", document_text)
    
    # Advanced usage with search engine
    engine = SOPSearchEngine()
    results = engine.search("power outage", document_text, max_results=10)
"""

import re
import logging
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
from datetime import datetime


@dataclass
class SearchResult:
    """
    Represents a single search result from the SOP documents.
    """
    snippet: str
    score: float
    file_source: str = ""
    line_number: int = 0
    context_before: str = ""
    context_after: str = ""
    match_type: str = "keyword"  # keyword, phrase, fuzzy


class SOPSearchEngine:
    """
    Advanced search engine for SOP documents with multiple search strategies.
    """
    
    def __init__(self):
        """Initialize the SOP Search Engine."""
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Common words to ignore in searches (stop words)
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        }
    
    def _clean_and_tokenize(self, text: str) -> List[str]:
        """
        Clean and tokenize text for searching.
        
        Args:
            text (str): Input text to tokenize
            
        Returns:
            List[str]: List of cleaned tokens
        """
        # Convert to lowercase and remove extra whitespace
        text = text.lower().strip()
        
        # Split on word boundaries and filter out non-alphanumeric
        tokens = re.findall(r'\b\w+\b', text)
        
        # Remove stop words
        tokens = [token for token in tokens if token not in self.stop_words and len(token) > 2]
        
        return tokens
    
    def _extract_file_info(self, text: str) -> List[Tuple[str, str, int]]:
        """
        Extract file information from document text with file markers.
        
        Args:
            text (str): Full document text with file markers
            
        Returns:
            List[Tuple[str, str, int]]: List of (filename, content, start_line) tuples
        """
        file_sections = []
        
        # Pattern to match file headers: === FILE: filename.md ===
        file_pattern = r'=== FILE: ([^=]+) ==='
        end_pattern = r'=== END OF ([^=]+) ==='
        
        parts = re.split(file_pattern, text)
        
        if len(parts) > 1:
            # We have file markers
            for i in range(1, len(parts), 2):
                if i + 1 < len(parts):
                    filename = parts[i].strip()
                    content = parts[i + 1]
                    
                    # Remove end marker if present
                    content = re.sub(end_pattern, '', content).strip()
                    
                    file_sections.append((filename, content, 0))
        else:
            # No file markers, treat as single document
            file_sections.append(("unknown_document", text, 0))
        
        return file_sections
    
    def _score_match(self, query_tokens: List[str], text: str, match_type: str = "keyword") -> float:
        """
        Score a text match based on query tokens.
        
        Args:
            query_tokens (List[str]): Tokenized query
            text (str): Text to score
            match_type (str): Type of match (keyword, phrase, fuzzy)
            
        Returns:
            float: Score between 0 and 1
        """
        text_lower = text.lower()
        text_tokens = self._clean_and_tokenize(text)
        
        if not query_tokens or not text_tokens:
            return 0.0
        
        score = 0.0
        total_possible = len(query_tokens)
        
        # Basic keyword matching
        matches = 0
        for token in query_tokens:
            if token in text_tokens:
                matches += 1
                # Bonus for exact word match
                if f" {token} " in f" {text_lower} ":
                    matches += 0.5
        
        score = matches / total_possible
        
        # Bonus for phrase proximity
        if len(query_tokens) > 1:
            query_phrase = " ".join(query_tokens)
            if query_phrase in text_lower:
                score += 0.3  # Phrase match bonus
        
        # Bonus for match density (matches close together)
        if matches > 1:
            # Simple density calculation
            text_length = len(text_tokens)
            if text_length > 0:
                density_bonus = min(0.2, matches / text_length)
                score += density_bonus
        
        return min(1.0, score)  # Cap at 1.0
    
    def _find_context(self, text: str, match_line: str, context_size: int = 100) -> Tuple[str, str]:
        """
        Find context before and after a matching line.
        
        Args:
            text (str): Full text
            match_line (str): The matching line
            context_size (int): Characters of context to include
            
        Returns:
            Tuple[str, str]: (context_before, context_after)
        """
        lines = text.split('\n')
        match_index = -1
        
        # Find the line index
        for i, line in enumerate(lines):
            if match_line.strip() in line.strip():
                match_index = i
                break
        
        if match_index == -1:
            return "", ""
        
        # Get context before
        context_before = ""
        chars_count = 0
        for i in range(match_index - 1, -1, -1):
            line = lines[i].strip()
            if line and chars_count + len(line) <= context_size:
                context_before = line + "\n" + context_before
                chars_count += len(line)
            else:
                break
        
        # Get context after
        context_after = ""
        chars_count = 0
        for i in range(match_index + 1, len(lines)):
            line = lines[i].strip()
            if line and chars_count + len(line) <= context_size:
                context_after += line + "\n"
                chars_count += len(line)
            else:
                break
        
        return context_before.strip(), context_after.strip()
    
    def search(self, query: str, document_text: str, max_results: int = 20, 
               min_score: float = 0.1, include_context: bool = True) -> List[SearchResult]:
        """
        Advanced search with multiple strategies and scoring.
        
        Args:
            query (str): Search query
            document_text (str): Full text of all documents
            max_results (int): Maximum number of results to return
            min_score (float): Minimum score threshold
            include_context (bool): Whether to include context in results
            
        Returns:
            List[SearchResult]: List of search results sorted by score
        """
        if not query or not query.strip():
            return []
        
        query = query.strip()
        query_tokens = self._clean_and_tokenize(query)
        
        if not query_tokens:
            return []
        
        self.logger.info(f"Searching for: '{query}' (tokens: {query_tokens})")
        
        results = []
        file_sections = self._extract_file_info(document_text)
        
        for filename, content, start_line in file_sections:
            # Split content into paragraphs and lines
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            
            # Search paragraphs first (better context)
            for para in paragraphs:
                if len(para) < 10:  # Skip very short paragraphs
                    continue
                
                score = self._score_match(query_tokens, para)
                
                if score >= min_score:
                    context_before, context_after = "", ""
                    if include_context:
                        context_before, context_after = self._find_context(content, para)
                    
                    result = SearchResult(
                        snippet=para,
                        score=score,
                        file_source=filename,
                        line_number=0,  # Could be calculated if needed
                        context_before=context_before,
                        context_after=context_after,
                        match_type="paragraph"
                    )
                    results.append(result)
            
            # Search individual lines for specific matches
            for i, line in enumerate(lines):
                if len(line) < 5:  # Skip very short lines
                    continue
                
                # Skip if this line is already part of a paragraph result
                if any(line in result.snippet for result in results if result.file_source == filename):
                    continue
                
                score = self._score_match(query_tokens, line)
                
                if score >= min_score:
                    context_before, context_after = "", ""
                    if include_context:
                        context_before, context_after = self._find_context(content, line)
                    
                    result = SearchResult(
                        snippet=line,
                        score=score,
                        file_source=filename,
                        line_number=start_line + i,
                        context_before=context_before,
                        context_after=context_after,
                        match_type="line"
                    )
                    results.append(result)
        
        # Sort by score (descending) and limit results
        results.sort(key=lambda x: x.score, reverse=True)
        
        # Remove duplicates and limit results
        unique_results = []
        seen_snippets = set()
        
        for result in results:
            # Create a simplified version for duplicate detection
            simplified = result.snippet.lower().strip()
            if simplified not in seen_snippets:
                seen_snippets.add(simplified)
                unique_results.append(result)
                
                if len(unique_results) >= max_results:
                    break
        
        self.logger.info(f"Found {len(unique_results)} results for query '{query}'")
        return unique_results


def keyword_search(query: str, document_text: str) -> List[str]:
    """
    Simple keyword search function that returns matching text snippets.
    
    This is the main function requested in the requirements. It performs a basic
    keyword search on the document text and returns a list of matching snippets.
    
    Args:
        query (str): User's search query
        document_text (str): Full text of all documents
        
    Returns:
        List[str]: List of matching text snippets, or message if no results found
    """
    if not query or not query.strip():
        return ["Please provide a search query."]
    
    if not document_text or not document_text.strip():
        return ["No documents available to search."]
    
    # Use the advanced search engine internally
    engine = SOPSearchEngine()
    results = engine.search(query, document_text, max_results=15, min_score=0.15)
    
    if not results:
        return [f"No results found for '{query}'. Try different keywords or check spelling."]
    
    # Convert results to simple string list with enhanced content extraction
    snippets = []
    for result in results:
        # Extract more context around the match
        enhanced_snippet = _extract_enhanced_content(result, document_text, query)
        
        # Format the snippet with file source if available
        if result.file_source and result.file_source != "unknown_document":
            snippet = f"[{result.file_source}] {enhanced_snippet}"
        else:
            snippet = enhanced_snippet
        
        snippets.append(snippet)
    
    return snippets


def _extract_enhanced_content(result: SearchResult, document_text: str, query: str) -> str:
    """
    Extract enhanced content with more context around search results.
    
    Args:
        result (SearchResult): Search result object
        document_text (str): Full document text
        query (str): Original search query
        
    Returns:
        str: Enhanced content snippet with more context
    """
    snippet = result.snippet
    
    # Try to find the snippet in the full document to get more context
    try:
        # Find the position of this snippet in the full document
        snippet_pos = document_text.find(snippet)
        
        if snippet_pos != -1:
            # Extract a larger context (up to 800 characters)
            context_size = 400
            start_pos = max(0, snippet_pos - context_size)
            end_pos = min(len(document_text), snippet_pos + len(snippet) + context_size)
            
            enhanced_content = document_text[start_pos:end_pos]
            
            # Clean up the content - remove excessive newlines
            enhanced_content = re.sub(r'\n\s*\n\s*\n', '\n\n', enhanced_content)
            enhanced_content = enhanced_content.strip()
            
            # If we extracted more content, use it
            if len(enhanced_content) > len(snippet) + 50:
                # Add markers to show the relevant section
                query_words = query.lower().split()
                
                # Try to find a good section that contains multiple query words
                lines = enhanced_content.split('\n')
                best_section = ""
                best_score = 0
                
                for i in range(len(lines)):
                    # Look at 3-5 line windows
                    for window_size in [3, 4, 5]:
                        if i + window_size <= len(lines):
                            section = '\n'.join(lines[i:i+window_size])
                            section_lower = section.lower()
                            
                            # Score this section
                            score = sum(1 for word in query_words if word in section_lower)
                            
                            if score > best_score and len(section.strip()) > 100:
                                best_score = score
                                best_section = section.strip()
                
                if best_section and best_score > 0:
                    return best_section
                
                # Fallback to the enhanced content
                return enhanced_content
    
    except Exception:
        # If anything goes wrong, return the original snippet
        pass
    
    return snippet
    
    return snippets


def search_with_highlights(query: str, document_text: str, max_results: int = 10) -> List[Dict]:
    """
    Enhanced search function that returns results with highlighted keywords.
    
    Args:
        query (str): User's search query
        document_text (str): Full text of all documents
        max_results (int): Maximum number of results
        
    Returns:
        List[Dict]: List of dictionaries with detailed search results
    """
    engine = SOPSearchEngine()
    results = engine.search(query, document_text, max_results=max_results)
    
    if not results:
        return [{"message": f"No results found for '{query}'"}]
    
    query_tokens = engine._clean_and_tokenize(query)
    
    formatted_results = []
    for result in results:
        # Highlight keywords in the snippet
        highlighted_snippet = result.snippet
        for token in query_tokens:
            # Case-insensitive replacement with highlighting
            pattern = re.compile(re.escape(token), re.IGNORECASE)
            highlighted_snippet = pattern.sub(f"**{token}**", highlighted_snippet)
        
        formatted_result = {
            "snippet": highlighted_snippet,
            "original_snippet": result.snippet,
            "score": round(result.score, 3),
            "file_source": result.file_source,
            "match_type": result.match_type,
            "context_before": result.context_before,
            "context_after": result.context_after
        }
        formatted_results.append(formatted_result)
    
    return formatted_results


# Utility functions for specialized searches
def search_procedures(query: str, document_text: str) -> List[str]:
    """Search specifically for procedures and step-by-step instructions."""
    # Add procedure-specific keywords to boost relevance
    procedure_keywords = ["step", "procedure", "process", "follow", "instructions", "guide"]
    enhanced_query = f"{query} {' '.join(procedure_keywords)}"
    
    return keyword_search(enhanced_query, document_text)


def search_troubleshooting(query: str, document_text: str) -> List[str]:
    """Search specifically for troubleshooting information."""
    troubleshooting_keywords = ["troubleshoot", "problem", "issue", "error", "fix", "resolve", "solution"]
    enhanced_query = f"{query} {' '.join(troubleshooting_keywords)}"
    
    return keyword_search(enhanced_query, document_text)


def search_emergency(query: str, document_text: str) -> List[str]:
    """Search specifically for emergency procedures."""
    emergency_keywords = ["emergency", "urgent", "critical", "alarm", "failure", "outage", "incident"]
    enhanced_query = f"{query} {' '.join(emergency_keywords)}"
    
    return keyword_search(enhanced_query, document_text)


# Example usage and testing
if __name__ == "__main__":
    # Test data
    sample_document = """
    === FILE: power_outage_procedures.md ===
    
    # Power Outage Response Procedures
    
    ## Emergency Response
    When a power outage occurs, follow these critical steps:
    1. Assess the scope of the outage
    2. Notify the operations center immediately
    3. Check backup power systems
    4. Coordinate with field teams
    
    ## Troubleshooting Steps
    Before declaring an emergency:
    - Check circuit breakers and protective relays
    - Verify transformer status
    - Test communication systems
    - Review recent maintenance activities
    
    === END OF power_outage_procedures.md ===
    
    === FILE: maintenance_guide.md ===
    
    # Routine Maintenance Procedures
    
    ## Transformer Maintenance
    Regular transformer inspections should include:
    - Oil level checks
    - Temperature monitoring
    - Bushing inspection
    - Cooling system verification
    
    ## Safety Protocols
    Always follow safety procedures when working on electrical equipment.
    Use proper personal protective equipment (PPE).
    
    === END OF maintenance_guide.md ===
    """
    
    # Test the search functions
    print("🔍 Testing SOP Search Functions")
    print("=" * 50)
    
    # Test 1: Basic keyword search
    print("\n1️ Basic search for 'power outage':")
    results = keyword_search("power outage", sample_document)
    for i, result in enumerate(results, 1):
        print(f"   {i}. {result}")
    
    # Test 2: Emergency search
    print("\n2️ Emergency search for 'outage':")
    results = search_emergency("outage", sample_document)
    for i, result in enumerate(results, 1):
        print(f"   {i}. {result}")
    
    # Test 3: Advanced search with highlights
    print("\n3️ Advanced search with highlights for 'transformer':")
    results = search_with_highlights("transformer", sample_document, max_results=3)
    for i, result in enumerate(results, 1):
        if "message" in result:
            print(f"   {i}. {result['message']}")
        else:
            print(f"   {i}. Score: {result['score']} - {result['snippet']}")
    
    # Test 4: No results case
    print("\n4️ Search with no results:")
    results = keyword_search("nuclear reactor", sample_document)
    for result in results:
        print(f"   - {result}")
    
    print("\nSOP Search testing completed!")
