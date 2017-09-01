// Requires cors.js to be loaded first

"use strict";

var SOLR_CONFIG = {
	"server": "https://arcticdata.io/metacat/d1/mn/v2/query/solr?",  // Solr server
    "filter": "knb-lter-bnz",  // Filter results for an organization or user
    "limit": 10,  // Max number of results to retrieve per page
    "resultsElementId": "searchResults",  // Element to contain results
    "urlElementId": "searchUrl",  // Element to display search URL
    "countElementId": "resultCount",  // Element showing number of results
    "pagesElementId": "pagination",  // Element to display result page links
    "showPages": 5  // MUST BE ODD NUMBER! Max number of page links to show
};


// Get URL arguments
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// https://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf("?") !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, "$1" + key + "=" + value + "$2");
  }
  else {
    return uri + separator + key + "=" + value;
  }
}


// Parse Solr search results into HTML
function parseSolrResults(resultJson) {
    var docs = resultJson["response"]["docs"];
    var html = [];
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
		var names = doc["origin"].join(", ") + " ";
		var date = "(Published " + doc["datePublished"].slice(0, 10) + ")";
		var title = "<strong>" + doc["title"].trim() + "</strong>";
		var link = doc["resourceMap"][0];
		if (link.slice(0, 4) == "doi:") {
			link = "http://dx.doi.org/" + link.slice(4);
		}
		link = '<a rel="external" href="' + link + '" target="_blank">' + 
		       'View Dataset <i class="fa fa-external-link" ' + 
			   'aria-hidden="true"></i></a>';
		var row = "<p>" + names + date + "<br>" + title + "<br>" + link + 
				  "</p>";
        html.push(row);
    }
    if (html.length) {
        return html.join("\n");
    }
    else {
        return "<p>Your search returned no results.</p>";
    }
}


function makePageLink(currentUrl, currentStart, start, linkText) {
    var uri = updateQueryStringParameter(currentUrl, "start", start);
    var tagStart = '<a href="';
    if (currentStart == start) {
        uri = "#";
        if (!linkText.toString().startsWith("&")) {
            tagStart = '<a class="active" href="';
        }
    }
    var link = tagStart + uri + '">' + linkText + '</a>';
    return link;
}


// Creates links to additional pages of search results.
// Requires a start URI argument indicating start index of search results
// as passed to the server providing the search results.
function makePageLinks(total, limit, showPages, currentStart) {
    if (total <= limit) {
        return "";
    }

    var currentUrl = window.location.href;
    var numPages = Math.ceil(total / limit);
    var currentPage = Math.floor(currentStart / limit) + 1;
    var pagesLeftRight = Math.floor(showPages / 2);
    var startPage = currentPage - pagesLeftRight;
    var endPage = currentPage + pagesLeftRight;

    if (endPage > numPages) {
        endPage = numPages;
        startPage = endPage - showPages + 1;
    }
    if (startPage <= 0) {
        startPage = 1;
        endPage = showPages;
        if (endPage > numPages) {
            endPage = numPages;
        }
    }

    var link_list = [];
    link_list.push(makePageLink(currentUrl, currentStart, 0, "&laquo;"));
    for (var i = startPage; i <= endPage; i++) {
        var startIndex = (i - 1) * limit;
        link_list.push(makePageLink(currentUrl, currentStart, startIndex, i));
    }
    var lastIndex = (numPages - 1) * limit;
    link_list.push(
        makePageLink(currentUrl, currentStart, lastIndex, "&raquo;"));

    return link_list.join("");
}


function showResultCount(total, limitPerPage, currentStartIndex) {
    if (total == 0) {
        return;
    }

    var s = "";
    if (total > 1) {
        s = "s";
    }
    if (total <= limitPerPage) {
        var html = "<p>Found " + total + " result" + s + "</p>";
    }
    else {
        var fromCount = currentStartIndex + 1;
        var toCount = currentStartIndex + limitPerPage;
        if (toCount > total) {
            toCount = total;
        }
        var html = ("<p>Showing results " + fromCount + " to " + toCount + 
                    " out of " + total + "</p>");
    }
    var element = document.getElementById(SOLR_CONFIG["countElementId"]);
    element.innerHTML = html;
}


// Function to call if CORS request is successful
function successCallback(headers, response) {
    document.body.style.cursor = "default";

    // Write results to page
	document.getElementById("searchResults").innerHTML = response;
    var data = JSON.parse(response);
    var resultHtml = parseSolrResults(data);
    var elementId = SOLR_CONFIG["resultsElementId"];
    document.getElementById(elementId).innerHTML = resultHtml;

    // Add links to additional search result pages if necessary
    var currentStart = getParameterByName("start");
    if (!currentStart) {
        currentStart = 0;
    }
    else {
        currentStart = parseInt(currentStart);
    }
    var count = parseInt(data["response"]["numFound"]);
    var limit = parseInt(SOLR_CONFIG["limit"]);
    var showPages = parseInt(SOLR_CONFIG["showPages"]);
    var pageLinkHtml = makePageLinks(count, limit, showPages, currentStart);
    var pageElementId = SOLR_CONFIG["pagesElementId"];
    document.getElementById(pageElementId).innerHTML = pageLinkHtml;
    
    showResultCount(count, limit, currentStart);
}


// Function to call if CORS request fails
function errorCallback() {
    document.body.style.cursor = "default";
    alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
    var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
    var element = document.getElementById(SOLR_CONFIG["urlElementId"]);
    element.innerHTML = txt;
}


// Passes search URL and callbacks to CORS function
function searchSolr(query, coreArea="", start=0) {
    var base = SOLR_CONFIG["server"];
	var fields = ["title",
				  "origin",
				  "datePublished",
				  "resourceMap"].toString();
    var params = "fl=" + fields + "&defType=edismax&wt=json";
    var limit = "&rows=" + SOLR_CONFIG["limit"];
    start = "&start=" + start;
	query = "&q=" + SOLR_CONFIG["filter"] + " " + query;
	var area = "&fq=keywords:" + coreArea;
	if (coreArea == null || coreArea == "" || coreArea == "any") {
		area = "";
	}
    var url = base + params + limit + start + area + query;
    showUrl(url);
    document.body.style.cursor = "wait";
    makeCorsRequest(url, successCallback, errorCallback);
}


// When the window loads, read query parameters and perform search
window.onload = function() {
    var query = getParameterByName("q");
    var start = getParameterByName("start");
    var coreArea = getParameterByName("coreArea");
    if (query == null) {
        query = "";
    }
	document.forms.dataSearchForm.q.value = query;
    var areas = document.getElementById("coreArea");
	for (var i=0; i < areas.length; i++) {
		if (coreArea == areas[i].value) {
			areas[i].selected = true;
			break;
		}
	}
	
    if (!start) {
        start = 0;
    }
    searchSolr(query, coreArea, start);
};