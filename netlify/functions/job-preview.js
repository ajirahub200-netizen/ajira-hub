const SUPABASE_URL = "https://jvgvmnzekjkaakgqkoct.supabase.co";
const SUPABASE_KEY = "sb_publishable_5h9e4kX950OSHjhKvcGTDg_X8AILbMk";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function absoluteUrl(base, value) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

exports.handler = async (event) => {
  const slug = event.queryStringParameters?.slug;

  if (!slug) {
    return {
      statusCode: 400,
      headers: {"content-type":"text/html; charset=utf-8"},
      body: "<h1>Job slug missing</h1>"
    };
  }

  const select = [
    "id","title","slug","location","job_type",
    "description","requirements","deadline",
    "company_logo_url","featured_image_url",
    "status","companies(name,logo_url)","categories(name)"
  ].join(",");

  const url =
    `${SUPABASE_URL}/rest/v1/jobs` +
    `?select=${encodeURIComponent(select)}` +
    `&slug=eq.${encodeURIComponent(slug)}` +
    `&status=eq.published` +
    `&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase HTTP ${response.status}`);
    }

    const rows = await response.json();
    const job = rows?.[0];

    if (!job) {
      return {
        statusCode: 404,
        headers: {"content-type":"text/html; charset=utf-8"},
        body: `<!doctype html><html lang="sw"><head><meta charset="utf-8"><title>Job haijapatikana</title></head><body><h1>Job haijapatikana</h1><p>Link hii haipo au job imefungwa.</p></body></html>`
      };
    }

    const company = job.companies?.name || "Company";
    const category = job.categories?.name || "Jobs";
    const title = `${job.title} | ${company} | Ajira & Connection Hub TZ`;
    const description =
      `${job.location || "Tanzania"} • ${job.job_type || "Full Time"}. ` +
      `Soma details na Apply kupitia Ajira & Connection Hub TZ.`;

    const publicBase = `https://${event.headers.host || "ajirahub12.netlify.app"}`;
    const canonical = `${publicBase}/job/${encodeURIComponent(job.slug)}`;
    const appPage = `${publicBase}/job.html?slug=${encodeURIComponent(job.slug)}`;

    const image = absoluteUrl(
      publicBase,
      job.featured_image_url || job.company_logo_url || job.companies?.logo_url
    );

    const body = `<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <link rel="canonical" href="${esc(canonical)}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Ajira & Connection Hub TZ">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
  <meta property="og:image:alt" content="${esc(job.title)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}

  <style>
    body{font-family:Arial,sans-serif;background:#f5f8fc;color:#172033;margin:0}
    main{max-width:760px;margin:70px auto;padding:28px;background:#fff;border-radius:16px;text-align:center}
    img{max-width:100%;max-height:260px;object-fit:contain;border-radius:12px}
    a{display:inline-block;margin-top:18px;background:#0b65c2;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <main>
    ${image ? `<img src="${esc(image)}" alt="${esc(job.title)}">` : ""}
    <h1>${esc(job.title)}</h1>
    <p><strong>${esc(company)}</strong></p>
    <p>📍 ${esc(job.location || "Tanzania")} • 💼 ${esc(job.job_type || "Full Time")}</p>
    <a href="${esc(appPage)}">Fungua Job Details</a>
  </main>

  <script>
    setTimeout(function(){
      window.location.replace(${JSON.stringify(appPage)});
    }, 700);
  </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        "content-type":"text/html; charset=utf-8",
        "cache-control":"public,max-age=60,s-maxage=300"
      },
      body
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {"content-type":"text/html; charset=utf-8"},
      body: "<h1>Server error</h1><p>Imeshindikana kupata taarifa za job.</p>"
    };
  }
};
