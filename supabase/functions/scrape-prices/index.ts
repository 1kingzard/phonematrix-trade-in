import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const cronToken = req.headers.get('x-cron-token');
    const isCron = !!cronToken;

    const { data: settings } = await supabase.from('scraper_settings').select('*').limit(1).maybeSingle();

    if (isCron) {
      const { data: tok } = await supabase.from('scraper_cron_token').select('token').eq('id', 1).maybeSingle();
      if (!tok || tok.token !== cronToken) return json({ error: 'Unauthorized' }, 401);
      if (settings && settings.auto_refresh === false) return json({ ok: true, skipped: 'auto refresh off' });
    } else {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
      if (!isAdmin) return json({ error: 'Forbidden' }, 403);
    }

    let urls: string[] = [];
    if (typeof body.url === 'string' && body.url) urls = [body.url];
    else urls = [settings?.swappa_url, settings?.backmarket_url].filter((u): u is string => !!u);
    if (!urls.length) return json({ error: 'No source URLs configured' }, 400);

    const markup = Number(settings?.markup_percent ?? 60) / 100;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) return json({ error: 'FIRECRAWL_API_KEY missing' }, 500);

    const results: Record<string, number | string> = {};
    let total = 0;
    for (const url of urls) {
      const source = url.includes('backmarket') ? 'backmarket' : 'swappa';
      try {
        total += await scrapeOne(supabase, firecrawlKey, url, source, markup);
        results[source] = 'ok';
      } catch (e: any) {
        console.error('scrape failed', url, e?.message);
        results[source] = e?.message ?? 'failed';
      }
    }

    if (settings?.id) await supabase.from('scraper_settings').update({ last_run_at: new Date().toISOString() }).eq('id', settings.id);

    return json({ ok: true, count: total, results, markup_percent: markup * 100 });
  } catch (e: any) {
    console.error(e);
    return json({ error: e?.message ?? 'Server error' }, 500);
  }
});

async function scrapeOne(supabase: any, firecrawlKey: string, url: string, source: string, markup: number): Promise<number> {
    const schema = {
      type: 'object',
      properties: {
        listings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              brand: { type: 'string' },
              model: { type: 'string' },
              storage: { type: 'string' },
              condition: { type: 'string' },
              price_usd: { type: 'number' },
            },
            required: ['model', 'price_usd'],
          },
        },
      },
      required: ['listings'],
    };

    const fcRes = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: [{ type: 'json', schema, prompt: 'Extract every phone/device listing on this page. For each, return brand, model name, storage capacity (like 128GB), condition label (like Mint/Good/Fair), and the USD price as a number.' }],
        onlyMainContent: true,
      }),
    });
    const fcData = await fcRes.json();
    if (!fcRes.ok) throw new Error(`Firecrawl [${fcRes.status}]: ${JSON.stringify(fcData).slice(0, 300)}`);

    const extracted = fcData?.data?.json ?? fcData?.json ?? {};
    const listings: any[] = Array.isArray(extracted?.listings) ? extracted.listings : [];

    const rows = listings
      .filter(l => l && l.model && Number(l.price_usd) > 0)
      .map(l => {
        const market = Number(l.price_usd);
        return {
          source_url: url,
          source,
          brand: l.brand || null,
          model: String(l.model),
          storage: l.storage || null,
          condition: l.condition || null,
          market_price_usd: market,
          suggested_price_usd: Math.round(market * markup),
          status: 'pending',
        };
      });

    if (rows.length) {
      const { error: insErr } = await supabase.from('scraped_prices').insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
    return rows.length;
}

/* end */
function _unused() {
  try {
    return;
  } catch (e: any) {
    console.error(e);
    return json({ error: e?.message ?? 'Server error' }, 500);
  }
}
  } catch (e: any) {
    console.error(e);
    return json({ error: e?.message ?? 'Server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}