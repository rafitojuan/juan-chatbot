/**
 * Real-Time Web Search & Grounding Engine for J1 AI Chat
 * Primary Engine: Tavily Search API
 * Fallback Engine: Wikipedia Multi-language Full-Text Snippets & DuckDuckGo Instant Answers
 */

export const TAVILY_API_KEY_DEFAULT = import.meta.env.VITE_TAVILY_API_KEY || '';

/**
 * Heuristic detector to identify if a query requires live web / current information
 * @param {string} text 
 * @returns {boolean}
 */
export function shouldSearchWeb(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // Explicit search triggers
  if (lower.startsWith('/search ') || lower.startsWith('/web ') || lower.startsWith('/cari ')) {
    return true;
  }

  // Temporal & freshness keywords
  const temporalKeywords = [
    'sekarang', 'terbaru', 'terkini', 'hari ini', 'kemarin', 'minggu ini', 'bulan ini',
    'tahun ini', '2024', '2025', '2026', '2027', 'berita', 'update', 'rilis', 'jadwal',
    'presiden', 'menteri', 'gubernur', 'juara', 'pemenang', 'ballon d', 'ballon dor', 'balon dor',
    'klasemen', 'harga', 'skor', 'gempa', 'cuaca', 'trending', 'viral', 'siapa yang',
    'kapan rilis', 'versi baru', 'pemilu', 'who is', 'latest', 'today', 'current',
    'news', 'release date', 'winner', 'price'
  ];

  return temporalKeywords.some(kw => lower.includes(kw));
}

/**
 * Clean, normalize, and extract entity aliases for better search hits
 * @param {string} text 
 * @returns {string}
 */
export function cleanSearchQuery(text) {
  let q = text
    .replace(/^\/(?:search|web|cari)\s+/i, '')
    .replace(/[?!.,;:]+$/, '')
    .trim();

  // Common entity normalizations
  q = q.replace(/\bballon\s*d?['’]?o?r\b/gi, "Ballon d'Or");
  q = q.replace(/\bucl\b/gi, 'UEFA Champions League');
  q = q.replace(/\bpildun\b/gi, 'Piala Dunia');

  return q;
}

/**
 * Strip HTML tags from string
 * @param {string} html 
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Primary Engine: Fetch rich web search results from Tavily API
 * @param {string} query 
 * @param {string} apiKey 
 * @returns {Promise<{ hasResults: boolean, answer?: string, results: Array<{title: string, extract: string, url: string, source: string}> }>}
 */
async function fetchTavilySearch(query, apiKey) {
  if (!apiKey) return { hasResults: false, results: [] };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true
      })
    });
    if (!res.ok) return { hasResults: false, results: [] };
    const data = await res.json();
    if (!Array.isArray(data.results) || data.results.length === 0) {
      return { hasResults: false, results: [] };
    }

    const results = data.results.map(r => ({
      title: r.title,
      extract: r.content,
      url: r.url,
      source: 'Tavily Web Search'
    }));

    return {
      hasResults: true,
      answer: data.answer || '',
      results
    };
  } catch (err) {
    console.warn('Tavily search error:', err);
    return { hasResults: false, results: [] };
  }
}

/**
 * Fallback Engine 1: Fetch full-text search snippets from Wikipedia
 * @param {string} query 
 * @param {'id'|'en'} lang 
 * @returns {Promise<Array<{title: string, extract: string, url: string, source: string}>>}
 */
async function fetchWikipediaSnippets(query, lang = 'id') {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];

    const data = await res.json();
    const searchResults = data.query?.search;
    if (!Array.isArray(searchResults)) return [];

    return searchResults
      .filter(item => item.snippet && item.snippet.trim().length > 10)
      .map(item => ({
        title: item.title,
        extract: stripHtml(item.snippet),
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
        source: `Wikipedia (${lang.toUpperCase()})`
      }));
  } catch (err) {
    console.warn(`Wikipedia ${lang} search snippet error:`, err);
    return [];
  }
}

/**
 * Fallback Engine 2: Fetch article lead extracts from Wikipedia
 * @param {string} query 
 * @param {'id'|'en'} lang 
 * @returns {Promise<Array<{title: string, extract: string, url: string, source: string}>>}
 */
async function fetchWikipediaExtracts(query, lang = 'id') {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .filter(p => p.extract && p.extract.trim().length > 20)
      .map(p => ({
        title: p.title,
        extract: p.extract.slice(0, 600).trim(),
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/\s+/g, '_'))}`,
        source: `Wikipedia (${lang.toUpperCase()})`
      }));
  } catch (err) {
    console.warn(`Wikipedia ${lang} extract error:`, err);
    return [];
  }
}

/**
 * Fallback Engine 3: Fetch DuckDuckGo Instant Answer
 * @param {string} query 
 * @returns {Promise<Array<{title: string, extract: string, url: string, source: string}>>}
 */
async function fetchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        extract: data.AbstractText,
        url: data.AbstractURL || 'https://duckduckgo.com',
        source: 'DuckDuckGo Instant Answer'
      });
    }

    return results;
  } catch (err) {
    console.warn('DuckDuckGo search error:', err);
    return [];
  }
}

/**
 * Execute real-time multi-source web search with Tavily primary and Wikipedia fallback
 * @param {string} userQuery 
 * @returns {Promise<{ hasResults: boolean, context: string, sources: Array<{title: string, url: string}> }>}
 */
export async function searchWeb(userQuery) {
  const query = cleanSearchQuery(userQuery);
  if (!query) {
    return { hasResults: false, context: '', sources: [] };
  }

  const tavilyKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('j1_tavily_api_key') : '') || TAVILY_API_KEY_DEFAULT;

  // 1. Try Primary Engine: Tavily Search
  if (tavilyKey) {
    try {
      const tavilyData = await fetchTavilySearch(query, tavilyKey);
      if (tavilyData.hasResults && tavilyData.results.length > 0) {
        let contextLines = [];
        
        if (tavilyData.answer) {
          contextLines.push(`[RINGKASAN JAWABAN WEB LANGSUNG]:\n${tavilyData.answer}`);
        }

        tavilyData.results.forEach((r, i) => {
          contextLines.push(`[${i + 1}] Sumber: ${r.title}\nInformasi/Fakta: ${r.extract}\nURL: ${r.url}`);
        });

        const formattedContext = contextLines.join('\n\n');
        const sources = tavilyData.results.map(r => ({ title: r.title, url: r.url }));

        return {
          hasResults: true,
          context: formattedContext,
          sources
        };
      }
    } catch (err) {
      console.warn('Tavily search primary failed, falling back to Wikipedia/DDG:', err);
    }
  }

  // 2. Fallback Engine: Wikipedia & DuckDuckGo Multi-Source
  const coreKeywords = query
    .replace(/^(?:siapa|kapan|dimana|apa|bagaimana|mengapa|who is|when is|what is|how to)\s+(?:yang\s+)?(?:pemenang|juara|hasil|presiden|peraih)?\s*/i, '')
    .trim();

  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 4500));

  const [idSnippets, idCoreSnippets, idExtracts, enSnippets, ddg] = await Promise.all([
    Promise.race([fetchWikipediaSnippets(query, 'id'), timeoutPromise]),
    coreKeywords && coreKeywords !== query ? Promise.race([fetchWikipediaSnippets(coreKeywords, 'id'), timeoutPromise]) : Promise.resolve([]),
    Promise.race([fetchWikipediaExtracts(coreKeywords || query, 'id'), timeoutPromise]),
    Promise.race([fetchWikipediaSnippets(coreKeywords || query, 'en'), timeoutPromise]),
    Promise.race([fetchDuckDuckGo(query), timeoutPromise])
  ]);

  const allResults = [
    ...idCoreSnippets,
    ...idSnippets,
    ...idExtracts,
    ...ddg,
    ...enSnippets
  ];

  const uniqueResults = [];
  const seenKeys = new Set();

  for (const item of allResults) {
    const key = `${item.title.toLowerCase().trim()}_${item.extract.slice(0, 30)}`;
    if (!seenKeys.has(key) && item.extract) {
      seenKeys.add(key);
      uniqueResults.push(item);
    }
    if (uniqueResults.length >= 6) break;
  }

  if (uniqueResults.length === 0) {
    return { hasResults: false, context: '', sources: [] };
  }

  const contextLines = uniqueResults.map((r, i) => {
    return `[${i + 1}] Sumber: ${r.title} (${r.source})\nInformasi/Fakta: ${r.extract}\nURL: ${r.url}`;
  });

  const formattedContext = contextLines.join('\n\n');
  const sources = uniqueResults.map(r => ({ title: r.title, url: r.url }));

  return {
    hasResults: true,
    context: formattedContext,
    sources
  };
}
