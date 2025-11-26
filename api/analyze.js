// pdf-service/api/analyze.js
const fetch = require('node-fetch');
const { PDFDocument } = require('pdf-lib');

function bufFromBase64(b64){ return Buffer.from(b64,'base64'); }

module.exports = async (req,res) => {
  if (req.method !== 'POST') return res.status(405).json({ error:'POST only' });
  const body = req.body;
  if (!body) return res.status(400).json({ error:'Missing body' });

  let pdfBuf;
  if (body.data) pdfBuf = bufFromBase64(body.data);
  else if (body.url) {
    const r = await fetch(body.url);
    if (!r.ok) return res.status(400).json({ error:'fetch failed' });
    pdfBuf = Buffer.from(await r.arrayBuffer());
  } else return res.status(400).json({ error:'Provide data or url' });

  try {
    const pdfDoc = await PDFDocument.load(pdfBuf);
    const images = [];
    const numPages = pdfDoc.getPageCount();
    for (let i=0;i<numPages;i++) {
      const page = pdfDoc.getPage(i);
      const xobjs = page.node.Resources()?.XObject?.get?.() || page.node.Resources().XObject?.get?.();
      // pdf-lib doesn't expose easy API to extract embedded images; alternative: use pdfjs-dist (complex)
      // For pragmatic approach: render pages via external service OR request user to pass images separately.
    }
    // Fallback: return error instructing extraction approach
    return res.status(200).json({ note: "PDF image extraction in serverless is limited. Recommended: upload images separately or deploy PDF microservice with Poppler/Tesseract on Render/Fly."});
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
