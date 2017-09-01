# Solr-JavaScript-Search-Client
Example HTML, CSS, and JavaScript for searching for items in a Solr repository

## Motivation

On my Long Term Ecological Research (LTER) project's static HTML website, I needed a search interface into my datasets archived at the [Arctic Data Center](https://arcticdata.io/), whose search API uses [Solr](https://lucene.apache.org/solr/).  LTER websites must support searching by term as well as browsing by LTER core area. I needed pagination since thousands of results could be returned.

## Usage

Open the HTML file in your browser and enter a search term like water. When you click Search, the application searches for datasets at the Arctic Data Center from anothe LTER site (mine doesn't have any data archived at the time that I created this) called Bonanza Creek. Results are summarized on the page with external links to more details at the original data archive.

You can click Search with no terms specified to show the entire catalog, which is the default behavior when you load the page. 

To try filtering by core area, remove the search term and select the Disturbance core area.

## Customization

To change parameters such as how many search results to show at a time, see the SOLR_CONFIG variable in solr.js.  There you can also change the Solr server being queried and a filter for the group or user whose datasets you want to search. You can use an empty string for the filter parameter to search all datasets.

If you prefer to always require a search term, you can check that the query parameter has been set before performing a search with something like:

```javascript
if (query != "" && query != null) {
    // Do the search, etc.
}
```
