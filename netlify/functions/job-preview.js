const SUPABASE_URL = "https://jvgvmnzekjkaakgqkoct.supabase.co";
const SUPABASE_KEY = "sb_publishable_5h9e4kX950OSHjhKvcGTDg_X8AILbMk";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function absoluteUrl(origin, value) {
  if (!value) return "";

  try {
    return new URL(value, origin).href;
  } catch {
    return "";
  }
}

exports.handler = async (event) => {
  const slug = event.queryStringParameters?.slug;

  if (!slug) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/html; charset=UTF-8"
      },
      body: "<h1>Job slug missing</h1>"
    };
  }

  const select = [
    "id",
    "title",
    "slug",
    "location",
    "job_type",
    "description",
    "requirements",
    "deadline",
    "apply_link",
    "company_logo_url",
    "featured_image_url",
    "status",
    "companies(name,logo_url)",
    "categories(name)"
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
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supabase HTTP ${response.status}: ${errorText}`
      );
    }

    const rows = await response.json();
    const job = rows?.[0];

    if (!job) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        },
        body: `
<!doctype html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<title>Job haijapatikana</title>
</head>
<body>
<h1>Job haijapatikana</h1>
<p>Link hii haipo au job haijachapishwa.</p>
<a href="/">Rudi Home</a>
</body>
</html>
`
      };
    }

    const host =
      event.headers?.["x-forwarded-host"] ||
      event.headers?.host ||
      "ajirahub12.netlify.app";

    const protocol =
      event.headers?.["x-forwarded-proto"] ||
      "https";

    const origin = `${protocol}://${host}`;

    const company =
      job.companies?.name || "Ajira & Connection Hub TZ";

    const category =
      job.categories?.name || "Jobs";

    /*
      LINK YA PUBLIC
      Mfano:
      https://ajirahub12.netlify.app/job/ict-officer-vodacom-tanzania-plc
    */

    const publicUrl =
      `${origin}/job/${encodeURIComponent(job.slug)}`;

    /*
      UKURASA HALISI WA DETAILS
    */

    const detailsUrl =
      `${origin}/job.html?slug=${encodeURIComponent(job.slug)}`;

    /*
      PICHA:
      1. featured image
      2. company logo
      3. logo ya company table
    */

    const image = absoluteUrl(
      origin,
      job.featured_image_url ||
      job.company_logo_url ||
      job.companies?.logo_url
    );

    const title =
      `${job.title} | ${company}`;

    const description =
      `${company} • ` +
      `${job.location || "Tanzania"} • ` +
      `${job.job_type || "Full Time"}. ` +
      `Soma taarifa za nafasi hii na jinsi ya kuomba kupitia Ajira & Connection Hub TZ.`;

    /*
      HTML YA PREVIEW
    */

    const html = `<!doctype html>

<html lang="sw">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1">

<title>${esc(title)}</title>

<meta
  name="description"
  content="${esc(description)}"
>

<link
  rel="canonical"
  href="${esc(publicUrl)}"
>


<!-- =========================
     WHATSAPP / FACEBOOK PREVIEW
========================= -->

<meta
  property="og:type"
  content="article"
>

<meta
  property="og:site_name"
  content="Ajira & Connection Hub TZ"
>

<meta
  property="og:title"
  content="${esc(title)}"
>

<meta
  property="og:description"
  content="${esc(description)}"
>

<meta
  property="og:url"
  content="${esc(publicUrl)}"
>

${
  image
    ? `
<meta
  property="og:image"
  content="${esc(image)}"
>

<meta
  property="og:image:secure_url"
  content="${esc(image)}"
>

<meta
  property="og:image:type"
  content="image/png"
>

<meta
  property="og:image:width"
  content="1200"
>

<meta
  property="og:image:height"
  content="630"
>

<meta
  property="og:image:alt"
  content="${esc(job.title)}"
>
`
    : ""
}


<!-- =========================
     TWITTER PREVIEW
========================= -->

<meta
  name="twitter:card"
  content="summary_large_image"
>

<meta
  name="twitter:title"
  content="${esc(title)}"
>

<meta
  name="twitter:description"
  content="${esc(description)}"
>

${
  image
    ? `
<meta
  name="twitter:image"
  content="${esc(image)}"
>
`
    : ""
}


<style>

body {
  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #f5f8fc;

  color: #172033;

  margin: 0;
}

main {

  max-width: 760px;

  margin: 60px auto;

  padding: 30px;

  background: white;

  border-radius: 18px;

  text-align: center;

  box-shadow:
    0 10px 35px rgba(0,0,0,.08);
}

img {

  width: 100%;

  max-height: 360px;

  object-fit: contain;

  border-radius: 14px;

  margin-bottom: 20px;
}

h1 {

  font-size: 28px;

  margin-bottom: 10px;
}

p {

  font-size: 17px;

  line-height: 1.6;
}

a {

  display: inline-block;

  margin-top: 20px;

  padding: 13px 22px;

  background: #0b65c2;

  color: white;

  border-radius: 9px;

  text-decoration: none;

  font-weight: bold;
}

</style>

</head>


<body>

<main>

${
  image
    ? `
<img
  src="${esc(image)}"
  alt="${esc(job.title)}"
>
`
    : ""
}

<h1>
${esc(job.title)}
</h1>

<p>
<strong>
${esc(company)}
</strong>
</p>

<p>
📍 ${esc(job.location || "Tanzania")}
&nbsp; • &nbsp;
💼 ${esc(job.job_type || "Full Time")}
</p>

<p>
${esc(category)}
</p>

<a
  href="${esc(detailsUrl)}"
>
Fungua Job Details
</a>

</main>


<script>

/*
  MTUMIAJI AKIFUNGUA LINK
  ANAENDA KWENYE PAGE HALISI
*/

setTimeout(function () {

  window.location.href =
    ${JSON.stringify(detailsUrl)};

}, 500);

</script>

</body>

</html>`;

    return {

      statusCode: 200,

      headers: {

        "Content-Type":
          "text/html; charset=UTF-8",

        "Cache-Control":
          "public, max-age=60, s-maxage=300"

      },

      body: html
    };

  } catch (error) {

    console.error(
      "JOB PREVIEW ERROR:",
      error
    );

    return {

      statusCode: 500,

      headers: {

        "Content-Type":
          "text/html; charset=UTF-8"

      },

      body: `
<h1>Server error</h1>
<p>
Imeshindikana kupata taarifa za job.
</p>
`
    };
  }
};