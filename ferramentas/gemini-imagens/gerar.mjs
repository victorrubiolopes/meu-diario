// Gera as 4 ilustrações do redesign do Início via API do Gemini.
// Uso: node --env-file=.env gerar.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY não encontrada. Abra o arquivo .env nesta pasta e cole sua chave depois do "=".');
  process.exit(1);
}

const ILUSTRACOES = [
  {
    nome: 'boas-vindas',
    prompt: 'Ilustração vetorial plana, traço simples, sem sombra realista, formato quadrado. Um diário aberto com uma plantinha brotando das páginas, um sol pequeno no canto superior. Paleta de cores: fundo #f0dfd0, diário #b5734a, planta #4a7c59. Estilo minimalista de app de saúde/bem-estar.',
  },
  {
    nome: 'medidas-vazio',
    prompt: 'Ilustração vetorial plana, formato quadrado, de uma balança doméstica estilizada vista de frente, com pequenas linhas diagonais ao redor sugerindo movimento e progresso. Paleta de cores: fundo #d9ebee, balança #2f7a8c, detalhes #b5734a. Traço fino, sem preenchimento sólido nas linhas de movimento.',
  },
  {
    nome: 'fotos-vazio',
    prompt: 'Ilustração vetorial plana, formato quadrado, de uma câmera fotográfica estilizada vista de frente, com uma segunda foto levemente inclinada atrás dela sugerindo "antes e depois". Paleta de cores: fundo #f4e6c4, câmera #b5734a. Traço médio, cantos arredondados, sem sombra.',
  },
  {
    nome: 'marco-desbloqueado',
    prompt: 'Ilustração vetorial plana, formato quadrado, de uma medalha redonda dourada com fita dupla nas cores vermelho e terracota, com um checkmark simples no centro. Paleta de cores: medalha #c9962c, fitas #c0553f e #b5734a. Estilo celebrativo mas discreto, sem brilho nem glow.',
  },
];

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const PASTA_SAIDA = path.join(import.meta.dirname, 'saida');
mkdirSync(PASTA_SAIDA, { recursive: true });

async function gerar(item) {
  process.stdout.write(`Gerando "${item.nome}"... `);
  let resp;
  try {
    resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: item.prompt }] }] }),
    });
  } catch (e) {
    console.log(`✗ falha de rede (${e.message})`);
    return;
  }
  if (!resp.ok) {
    const erro = await resp.text();
    console.log(`✗ erro ${resp.status}: ${erro.slice(0, 300)}`);
    return;
  }
  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.data);
  if (!imgPart) {
    console.log(`✗ sem imagem na resposta: ${JSON.stringify(data).slice(0, 300)}`);
    return;
  }
  const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
  const ext = imgPart.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
  const destino = path.join(PASTA_SAIDA, `${item.nome}.${ext}`);
  writeFileSync(destino, buffer);
  console.log(`✓ salvo em saida/${item.nome}.${ext}`);
}

for (const item of ILUSTRACOES) {
  await gerar(item);
}
console.log('\nPronto! Veja os arquivos na pasta "saida".');
