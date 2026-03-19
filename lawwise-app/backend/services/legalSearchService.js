const axios = require("axios");

const searchLegalCases = async (query) => {
  const apiKey = process.env.COURTLISTENER_API_KEY;
  if (!apiKey || apiKey === "your_courtlistener_key_here") {
    console.warn("CourtListener API Key missing. Skipping external search.");
    return [];
  }

  try {
    const response = await axios.get(
      "https://www.courtlistener.com/api/rest/v4/search/",
      {
        params: { q: query },
        headers: { Authorization: `Token ${apiKey}` },
      },
    );

    return response.data.results.slice(0, 3).map((res) => ({
      title: res.caseName || res.caseNameFull || "Untitled Case",
      citation: Array.isArray(res.citation) ? res.citation[0] : res.citation,
      snippet: res.opinions?.[0]?.snippet || "No snippet available",
      url: `https://www.courtlistener.com${res.absolute_url}`,
    }));
  } catch (error) {
    console.error("CourtListener Search Error:", error.message);
    return [];
  }
};

module.exports = {
  searchLegalCases,
};
