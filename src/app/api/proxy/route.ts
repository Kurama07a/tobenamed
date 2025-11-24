import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic'; // Prevent caching

const CLICK_INTERCEPTOR_SCRIPT = (nodeId: string, targetUrl: string) => `
<script>
  (function() {
    console.log("GraphNav: Interceptor loaded for Node ${nodeId}");
    const TARGET_URL = "${targetUrl}";
    
    // --- 1. Link Click Interception ---
    function handleClick(e) {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      e.preventDefault();
      e.stopPropagation();

      const fullUrl = new URL(href, TARGET_URL).href;

      console.log("GraphNav: Link clicked", fullUrl);

      window.parent.postMessage({
        type: 'GRAPH_NAV_CLICK',
        url: fullUrl,
        nodeId: '${nodeId}',
        timestamp: Date.now()
      }, '*');
    }
    document.addEventListener('click', handleClick, true);

    // --- 2. API Call Interception (Fetch) ---
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
        let url = input;
        if (typeof input === 'string') {
            // If relative, resolve against target
            if (!input.startsWith('http')) {
                url = new URL(input, TARGET_URL).href;
            }
            // Proxy the request
            // We only proxy if it's not already proxied
            if (!url.includes('/api/proxy')) {
                 url = '/api/proxy?url=' + encodeURIComponent(url) + '&nodeId=${nodeId}';
            }
        }
        return originalFetch(url, init);
    };

    // --- 3. API Call Interception (XHR) ---
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string') {
             if (!url.startsWith('http')) {
                url = new URL(url, TARGET_URL).href;
            }
            if (!url.includes('/api/proxy')) {
                 url = '/api/proxy?url=' + encodeURIComponent(url) + '&nodeId=${nodeId}';
            }
        }
        return originalOpen.call(this, method, url, ...args);
    };

  })();
</script>
`;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    const nodeId = searchParams.get('nodeId') || 'unknown';

    if (!targetUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
    }

    try {
        // Fetch with arraybuffer to handle images/binary
        const response = await axios.get(finalUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            validateStatus: () => true
        });

        const contentType = response.headers['content-type'] || '';

        // Prepare headers
        const newHeaders = new Headers();
        newHeaders.set('Content-Type', contentType);
        newHeaders.set('X-Frame-Options', 'ALLOWALL');
        newHeaders.set('Content-Security-Policy', "frame-ancestors *;");
        newHeaders.set('Access-Control-Allow-Origin', '*');

        // If NOT HTML, return as is (pass-through for assets)
        if (!contentType.includes('text/html')) {
            return new NextResponse(response.data, {
                status: response.status,
                headers: newHeaders
            });
        }

        // If HTML, inject scripts
        const htmlContent = response.data.toString('utf-8');
        const $ = cheerio.load(htmlContent);

        if ($('base').length === 0) {
            $('head').prepend(`<base href="${finalUrl}">`);
        }

        $('body').append(CLICK_INTERCEPTOR_SCRIPT(nodeId, finalUrl));

        return new NextResponse($.html(), {
            status: response.status,
            headers: newHeaders
        });

    } catch (error: any) {
        console.error('Proxy error:', error.message);
        return new NextResponse(`Failed to fetch URL: ${error.message}`, { status: 500 });
    }
}
