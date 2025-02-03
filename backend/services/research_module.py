# services/research_module.py
import requests
from bs4 import BeautifulSoup
from collections import Counter
import re

def google_search(keywords, num_results=3, presentation_topic = ""):
    """
        Searches the web using the google api.
        Args:
            keywords: The list of keywords to search for.
            num_results: The number of results to return from the search.
            presentation_topic: the topic of the whole presentation
        Returns:
            A list of search results (strings)
    """
    query = f"{presentation_topic} " + " ".join(keywords)
    search_url = f"https://www.google.com/search?q={query}&num={num_results}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
      response = requests.get(search_url, headers=headers)
      response.raise_for_status()  # Raise an exception for non-200 status codes
      soup = BeautifulSoup(response.content, "html.parser")
      search_results = []
      for result in soup.find_all("div", class_="yuRUbf"):
          link_tag = result.find('a')
          if link_tag:
             link = link_tag.get('href')
             search_results.append(link)

      results = []
      for link in search_results:
          page_content = scrape_page_content(link)
          if page_content:
            results.append(page_content)

      return results

    except requests.exceptions.RequestException as e:
          print(f"Error during search request: {e}")
          return []
    except Exception as e:
          print(f"Error during search process: {e}")
          return []

def scrape_page_content(url):
    """
        Scrapes content from a web page.
        Args:
          url: Url of the page to scrape
        Returns:
          The text content of the given URL
    """
    headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        # Extract all the text from the page
        all_text = ' '.join([p.text for p in soup.find_all('p')])
        if not all_text:
           all_text = ' '.join([p.text for p in soup.find_all('div')])

        return all_text
    except requests.exceptions.RequestException as e:
          print(f"Error during scrape request: {e}")
          return ""
    except Exception as e:
          print(f"Error during scrape process: {e}")
          return ""


def summarize(results, num_keywords = 5):
    """
        Summarize the search results.
        Args:
            results: A list of strings
        Returns:
            A summary string
    """
    all_text = " ".join(results)
    if not all_text:
      return "No search results were found"
    text = re.sub(r'[^a-zA-Z0-9\s]', '', all_text).lower()
    words = text.split()
    word_counts = Counter(words)
    keywords = [word for word, count in word_counts.most_common(num_keywords*2)]
    summary = " ".join(keywords[0:num_keywords])
    return f"Here are some findings from the web about your topic: {summary} "

def search_and_summarize(keywords, presentation_topic,  num_results=3):
    """
        Search the internet and summarize the results.
        Args:
          keywords: The keyword list to search
          presentation_topic: Topic of the whole presentation.
          num_results: The number of results to gather from the internet
        Returns:
            A summarized string from the web
    """

    search_results = google_search(keywords, num_results, presentation_topic) # implement the search function
    summarized_research = summarize(search_results) # Implement the summarize function
    return summarized_research