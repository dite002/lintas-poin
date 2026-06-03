import express from 'express';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Setup SQLite local database connection
const dbFile = path.resolve(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbFile);

// Enable foreign key constraints in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Helper wrappers for promise-based sqlite queries
const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database schema and initial data
async function initDatabase() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        summary TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_featured INTEGER DEFAULT 0,
        author TEXT DEFAULT 'Redaksi Lintas Poin',
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'redaktur',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Run migration safely to add role column to existing databases
    try {
      await dbRun(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'redaktur'`);
      console.log('Successfully completed database schema migration: added role column to users');
    } catch (e) {
      // Column might already exist, ignore safely
    }

    // Seed default settings if they are missing
    try {
      const siteTitleCheck = await dbGet(`SELECT value FROM settings WHERE key = 'site_title'`);
      if (!siteTitleCheck) {
        await dbRun(`INSERT INTO settings (key, value) VALUES ('site_title', 'Edisi Utama')`);
      }
      const siteTaglineCheck = await dbGet(`SELECT value FROM settings WHERE key = 'site_tagline'`);
      if (!siteTaglineCheck) {
        await dbRun(`INSERT INTO settings (key, value) VALUES ('site_tagline', 'Redaksi Independen Lintas Poin • Media Siber & Pers')`);
      }
    } catch (e) {
      console.error('Error seeding site settings:', e);
    }

    // Verify if database needs seeding
    const catCheck = await dbGet(`SELECT COUNT(*) as count FROM categories`);
    if (catCheck.count === 0) {
      console.log('Seeding initial media news categories...');
      
      const seedCategories = [
        { name: 'Nasional', slug: 'nasional' },
        { name: 'Internasional', slug: 'internasional' },
        { name: 'Teknologi', slug: 'teknologi' },
        { name: 'Ekonomi', slug: 'ekonomi' },
        { name: 'Olahraga', slug: 'olahraga' },
        { name: 'Hiburan', slug: 'hiburan' }
      ];

      for (const cat of seedCategories) {
        await dbRun(`INSERT INTO categories (name, slug) VALUES (?, ?)`, [cat.name, cat.slug]);
      }

      console.log('Seeding initial media news articles...');
      const catsInDb = await dbAll(`SELECT id, slug FROM categories`);
      const catMap = new Map(catsInDb.map(c => [c.slug, c.id]));

      const seedArticles = [
        {
          title: 'Masa Depan AI Lokal: Pengembang Indonesia Sukses Bangun Model Mandiri',
          slug: 'masa-depan-ai-lokal-pengembang-indonesia-sukses-bangun-model-mandiri',
          summary: 'Insinyur perangkat lunak tanah air mulai membangun model bahasa (LLM) khusus bahasa Indonesia dan bahasa daerah guna merevolusi sektor pendidikan serta industri nasional secara offline.',
          content: `### Era Kemandirian AI di Indonesia

Masa depan kecerdasan buatan (AI) di Indonesia tidak lagi hanya bergantung pada infrastruktur komputasi awan global yang mahal. Sekelompok developer lokal berbakat telah membuktikan bahwa kita bisa merancang dan menerapkan model bahasa besar (Local-LLM) secara mandiri di server lokal.

#### Mengapa Model AI Lokal Sangat Berarti?

Keberadaan AI dengan wawasan lokal memberikan lompatan besar dalam hal fungsionalitas dan keamanan:

1. **Memahami Slang & Kultur**: Model AI konvensional seringkali bingung menerjemahkan dialek kasual, idiom daerah, atau cara berkomunikasi masyarakat Indonesia. AI lokal dilatih langsung dengan teks literatur Indonesia modern dan informal.
2. **Kemandirian Jaringan (Offline Capability)**: Mampu berjalan sepenuhnya di jaringan intranet lokal. Hal ini sangat bernilai untuk institusi pendidikan di pelosok daerah, korporasi sensitif data, hingga platform media berita mandiri.
3. **Kedaulatan Informasi**: Memperkecil paparan data sensitif terhadap agen asing dan memastikan hukum kedaulatan data digital (GDPR lokal) selalu terjaga.

> "Dengan SQLite dan server portabel offline, platform berita, asisten edukasi, dan dokumentasi lokal dapat beralih ke era pintar tanpa memerlukan kuota internet sekalipun." — *Redaksi Lintas Poin*

#### Dampak bagi Sektor Kreatif & Media

Platform media berita juga mengalami peningkatan kemudahan operasional. Melalui model AI lokal, penyuntingan naskah, pembuatan ringkasan (summary) berita, serta kategorisasi tag artikel secara otomatis dapat berjalan dalam milidetik di tingkat server lokal, tanpa perlu melakukan pemanggilan API eksternal yang memakan bandwidth.`,
          category_slug: 'teknologi',
          image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000',
          views: 135,
          is_featured: 1,
          author: 'Danu Kusuma'
        },
        {
          title: 'Desa Wisata Jember Raup Omzet Ratusan Juta Rupiah Berkat Ekowisata Kreatif',
          slug: 'desa-wisata-jember-raup-omzet-ratusan-juta-rupiah-berkat-ekowisata-kreatif',
          summary: 'Sektor pariwisata di pedesaan Jember berkembang pesat dengan memanfaatkan kearifan lokal, pertanian kopi organic, dan model homestay berkelanjutan yang dikelola warga lokal.',
          content: `### Kebangkitan Ekonomi Rakyat di Jember

Kawasan pedesaan di Kabupaten Jember, Jawa Timur, kini tidak hanya dikenal sebagai penghasil tembakau jempolan. Model pariwisata ramah lingkungan bercampur ekonomi kreatif terbukti melahirkan daya tarik ekonomi baru yang luar biasa bagi penduduk desa.

#### Keunikan Konsep Ekowisata Lokal

Desa wisata ini mengusung petualangan autentik yang mendekatkan turis kepada kehidupan bersahabat pedesaan:

- **Edukasi Kopi Organik**: Wisatawan diajari proses menyemai, memetik, menyangrai, hingga menyeduh kopi robusta khas lereng gunung secara tradisional.
- **Homestay Terpadu Warga**: Bernuansa rumah bambu tradisional dengan sajian masakan khas desa berbahan organik segar dari ladang tetangga.
- **Kerajinan Anyaman Serat Alam**: Mengubah anyaman eceng gondok dan bambu menjadi wadah estetis, tas fashion, dan kap lampu modern.

#### Mengandalkan Kemandirian Digital Lokal

Dalam mendukung promosi tanpa hambatan di daerah yang minim jangkauan sinyal internet stabil, pengelola desa wisata menerapkan aplikasi manajemen tamu offline. Sistem ini merekam seluruh data kunjungan, sewa homestay, koordinasi pemandu wisata, serta pelaporan keuangan harian secara mandiri pada database terpusat yang aman di balai desa.

Strategi ini terbukti mendongkrak pendapatan lokal secara masif tanpa memicu eksploitasi lingkungan atau hilangnya keramahan kultur lokal yang bersahaja.`,
          category_slug: 'ekonomi',
          image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000',
          views: 94,
          is_featured: 0,
          author: 'Siti Fauziah'
        },
        {
          title: 'Garuda Muda Raih Medali Emas Pertandingan Sengit Bersejarah',
          slug: 'garuda-muda-raih-medali-emas-pertandingan-sengit-bersejarah',
          summary: 'Perjuangan dramatis luar biasa hingga menit akhir perpanjangan waktu mengantarkan timnas nasional mencetak kemenangan bersejarah di hadapan ribuan pendukung.',
          content: `### Air Mata Bahagia dan Gelar Juara yang Dinanti

Stadion utama bergetar hebat saat peluit panjang dibunyikan. Setelah menjalani kompetisi melelahkan selama tiga minggu penuh, tim sepak bola nasional Garuda Muda akhirnya menahbiskan diri sebagai yang terbaik, merebut kemenangan tipis dalam drama laga final legendaris.

#### Ketahanan Mental di Bawah Tekanan

Sejak menit pertama dimulai, tim lawan melancarkan skema menyerang beruntun. Barisan pertahanan Garuda berkali-kali dipaksa jatuh bangun demi mementahkan peluang emas. Di saat banyak orang mengira pertandingan akan ditentukan lewat adu penalti, momentum perubahan datang pada menit ke-114 perpanjangan waktu.

- **Umpan lambung silang lambat** dari lini tengah dikirimkan menyusuri area kotak penalti.
- Striker pengganti berlari melepaskan diri dari kawalan dua bek lawan.
- Sundulan terarah menyilang bersarang di pojok kanan tiang jauh, tak mampu diraih kiper.

Skor **1-0** dirayakan dengan sukacita emosional oleh jutaan pemirsa di tanah air.

#### Keberhasilan Hasil Pembinaan Terpadu

Gelar juara ini dinobatkan sebagai simbol bangkitnya sepak bola usia muda di Indonesia yang dikelola secara profesional dari akar rumput. Komitmen, gizi seimbang, kebersamaan taktis, dan kegigihan tanpa lelah telah berbuah manis.`,
          category_slug: 'olahraga',
          image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000',
          views: 312,
          is_featured: 1,
          author: 'Rahmat Hidayat'
        },
        {
          title: 'Gaya Hidup Minimalis Jadi Solusi Kurangi Stres di Tengah Gelombang Belanja Online',
          slug: 'gaya-hidup-minimalis-solusi-kurangi-stres-gelombang-belanja-online',
          summary: 'Tren kesederhanaan mulai digandrungi kalangan urban Indonesia demi menjaga kesehatan finansial, menghentikan gaya hidup konsumerisme berlebih, dan melatih kedamaian batin.',
          content: `### Memangkas Berlebih, Menumbuhkan Makna

Di era digital saat ini, kemudahan berbelanja online lewat fitur "sekali klik" sering kali menjebak masyarakat urban dalam kebiasaan belanja impulsif. Akibatnya, rumah dipenuhi barang-barang yang tidak pernah dipakai dan lemari sesak oleh pakaian tanpa guna—sementara dompet dan pikiran terserap dalam kepusingan tanpa ujung.

#### Mengapa Gaya Hidup Minimalis Kian Digemari?

Filosofi minimalisme bukanlah bermaksud membatasi diri secara kaku, melainkan tentang menyaring hal-hal yang benar-benar memicu keceriaan dan membawa dampak fungsional:

1. **Efek Relaksasi Ruangan**: Ruang tinggal dengan penataan bersih dan barang minimal teruji secara psikologis menurunkan sekresi hormon stres kortisol.
2. **Kesehatan Keuangan**: Mengurangi pengeluaran tak perlu memudahkan alokasi uang dingin untuk asuransi, dana darurat, dan investasi produktif.
3. **Mengurangi Sampah Tekstil**: Kesadaran menggunakan pakaian berkualitas tinggi namun sedikit (*Capsule Wardrobe*) mengurangi jejak limbah industri garmen di alam.

> "Kebahagiaan sejati tidak ditemukan dari kepemilikan material tanpa henti, melainkan dari kebebasan memfokuskan tenaga pada relasi manusiawi, pembelajaran baru, dan pengalaman hidup." — *Psikolog Rina Wardani*

#### Langkah Praktis Menuju Minimalisme

Memulainya tidak sesulit yang dibayangkan:

- **Lakukan Audit 30 Hari**: Kelompokkan barang-barang Anda. Jika suatu benda tidak lagi digunakan atau disentuh dalam waktu satu bulan paling akhir, pertimbangkan untuk menyumbangkannya ke yayasan sosial.
- **Tahan Keinginan Membeli Selama 24 Jam**: Ketika melihat barang yang tampak menarik, masukkan dulu ke keranjang digital dan tunggu satu hari. Sering kali nafsu memiliki barang tersebut menguap begitu Anda terbangun di keesokan paginya.`,
          category_slug: 'nasional',
          image_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1000',
          views: 180,
          is_featured: 0,
          author: 'Laras Safitri'
        },
        {
          title: 'Robot Otonom Berhasil Temukan Jejak Air Abadi di Sisi Gelap Kawah Bulan',
          slug: 'robot-otonom-berhasil-temukan-jejak-air-abadi-kawah-bulan',
          summary: 'Perkembangan sains antariksa mencatatkan terobosan luar biasa mendeteksi struktur es air di bawah regolit beku Bulan yang dapat digunakan untuk penunjang nafas astronaut.',
          content: `### Misi Sukses Eksplorasi Kutub Selatan Bulan

Penjelajah otonom generasi terbaru yang diluncurkan dalam konsorsium sains global sukses menyelesaikan pengeboran tanah sedalam satu setengah meter di kawah abadi terjauh. Berdasarkan pembacaan data instrumen spektrometer neutron, terkonfirmasi adanya endapan murni es air dalam kuantitas masif di bawah debu regolit Bulan.

#### Mengapa Temuan Air Ini Sangat Krusial?

Air di luar angkasa bernilai bagaikan emas cair bagi kelanjutan peradaban manusia:

- **Bahan Bakar Luar Angkasa**: Molekul air ($H_2O$) bisa dipecah menjadi hidrogen cair dan oksigen cair, bertindak sebagai bahan propulsi utama bakar roket untuk mengantarkan roket meluncur menuju Mars.
- **Oksigen Mandiri**: Memberi ketersediaan sirkulasi udara bernafas yang melimpah bagi kru astronot di stasiun pengamatan Bulan luar angkasa tanpa perlu suplai logistik berulang dari Bumi.

Robot penjelajah ini akan melanjutkan proses pemetaan area kawah selama tiga bulan ke depan guna menyusun koordinat jalur perjalanan aman bagi pendaratan astronaut berawak yang direncanakan pada akhir dekade ini.`,
          category_slug: 'internasional',
          image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000',
          views: 86,
          is_featured: 0,
          author: 'Prof. Setyawan Koh'
        }
      ];

      for (const art of seedArticles) {
        const catId = catMap.get(art.category_slug);
        if (catId) {
          await dbRun(`
            INSERT INTO articles (title, slug, summary, content, category_id, image_url, views, is_featured, author)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [art.title, art.slug, art.summary, art.content, catId, art.image_url, art.views, art.is_featured, art.author]);
        }
      }

      // Seed initial comments on the first article
      const firstArticle = await dbGet(`SELECT id FROM articles LIMIT 1`);
      if (firstArticle) {
        await dbRun(`
          INSERT INTO comments (article_id, name, content)
          VALUES 
            (?, 'Hendra Gunawan', 'Mantap! Sangat bangga melihat anak bangsa mampu membangun model AI sendiri. Lintas Poin memang cepat menyajikan berita berkualitas.'),
            (?, 'Dian Sastro', 'Kebutuhan offline ini krusial sekali untuk daerah yang sinyalnya naik turun.')
        `, [firstArticle.id, firstArticle.id]);
      }
      console.log('Database successfully seeded with demo media news data!');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Ensure database sits fully initialized on start
initDatabase();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve local uploads folder statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Utility function to convert title strings into perfect URL slugs
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// API: List all categories and counts of articles within them
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbAll(`
      SELECT c.id, c.name, c.slug, COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get site settings
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbAll(`SELECT key, value FROM settings`);
    const settingsObj: Record<string, string> = {};
    rows.forEach((r) => {
      settingsObj[r.key] = r.value;
    });
    // Ensure default fallback if they somehow aren't in SQLite
    if (!settingsObj.site_title) settingsObj.site_title = 'Edisi Utama';
    if (!settingsObj.site_tagline) settingsObj.site_tagline = 'Redaksi Independen Lintas Poin • Media Siber & Pers';
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update site settings
app.post('/api/settings', async (req, res) => {
  const { site_title, site_tagline } = req.body;
  if (!site_title || !site_tagline) {
    return res.status(400).json({ error: 'Nama Edisi/Situs dan Tagline wajib diisi' });
  }

  try {
    await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES ('site_title', ?)`, [site_title.trim()]);
    await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES ('site_tagline', ?)`, [site_tagline.trim()]);
    res.json({ success: true, site_title, site_tagline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create custom category
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  }

  const slug = slugify(name);
  try {
    const existing = await dbGet(`SELECT id FROM categories WHERE slug = ? OR name = ?`, [slug, name.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Kategori dengan nama serupa telah ada' });
    }

    const { lastID } = await dbRun(`INSERT INTO categories (name, slug) VALUES (?, ?)`, [name.trim(), slug]);
    res.json({ id: lastID, name: name.trim(), slug, article_count: 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete category
app.delete('/api/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Check if category has articles
    const childArticles = await dbGet(`SELECT COUNT(*) as count FROM articles WHERE category_id = ?`, [id]);
    if (childArticles.count > 0) {
      return res.status(400).json({ 
        error: `Gagal menghapus. Kategori ini menampung ${childArticles.count} artikel. Silakan pindahkan atau hapus artikel terlebih dahulu.` 
      });
    }

    await dbRun(`DELETE FROM categories WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: List articles with dynamic filters, searches, and pagination
app.get('/api/articles', async (req, res) => {
  const { category, search, limit, is_featured } = req.query;

  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM articles a
    JOIN categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category) {
    query += ` AND c.slug = ? `;
    params.push(category);
  }

  if (is_featured !== undefined) {
    query += ` AND a.is_featured = ? `;
    params.push(is_featured === 'true' ? 1 : 0);
  }

  if (search) {
    query += ` AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?) `;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ` ORDER BY a.created_at DESC `;

  if (limit) {
    query += ` LIMIT ? `;
    params.push(parseInt(limit as string));
  }

  try {
    const articles = await dbAll(query, params);
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get specific article detail by slug and increment views
app.get('/api/articles/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const article = await dbGet(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ?
    `, [slug]);

    if (!article) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    // Async increment views count to keep things responsive
    await dbRun(`UPDATE articles SET views = views + 1 WHERE id = ?`, [article.id]);
    article.views += 1;

    // Load related comments
    const comments = await dbAll(`
      SELECT * FROM comments 
      WHERE article_id = ? 
      ORDER BY created_at DESC
    `, [article.id]);

    res.json({ article, comments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create Article
app.post('/api/articles', async (req, res) => {
  const { title, summary, content, category_id, image_url, is_featured, author } = req.body;

  if (!title || !summary || !content || !category_id || !image_url) {
    return res.status(400).json({ error: 'Semua kolom isian wajib diisi dengan lengkap' });
  }

  let slug = slugify(title);
  // Ensure slug uniqueness
  try {
    let duplicateCheck = await dbGet(`SELECT id FROM articles WHERE slug = ?`, [slug]);
    let slugIndex = 1;
    let uniqueSlug = slug;
    while (duplicateCheck) {
      uniqueSlug = `${slug}-${slugIndex}`;
      duplicateCheck = await dbGet(`SELECT id FROM articles WHERE slug = ?`, [uniqueSlug]);
      slugIndex++;
    }
    slug = uniqueSlug;

    const { lastID } = await dbRun(`
      INSERT INTO articles (title, slug, summary, content, category_id, image_url, is_featured, author)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title.trim(), slug, summary.trim(), content.trim(), parseInt(category_id), image_url.trim(), is_featured ? 1 : 0, author ? author.trim() : 'Redaksi Lintas Poin']);

    const newArticle = await dbGet(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [lastID]);

    res.json(newArticle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update Article
app.put('/api/articles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, summary, content, category_id, image_url, is_featured, author } = req.body;

  if (!title || !summary || !content || !category_id || !image_url) {
    return res.status(400).json({ error: 'Semua kolom isian wajib diisi dengan lengkap' });
  }

  const slug = slugify(title);
  try {
    // Check slug uniqueness with other files
    let duplicateCheck = await dbGet(`SELECT id FROM articles WHERE slug = ? AND id != ?`, [slug, id]);
    let uniqueSlug = slug;
    let slugIndex = 1;
    while (duplicateCheck) {
      uniqueSlug = `${slug}-${slugIndex}`;
      duplicateCheck = await dbGet(`SELECT id FROM articles WHERE slug = ? AND id != ?`, [uniqueSlug, id]);
      slugIndex++;
    }

    await dbRun(`
      UPDATE articles 
      SET title = ?, slug = ?, summary = ?, content = ?, category_id = ?, image_url = ?, is_featured = ?, author = ?
      WHERE id = ?
    `, [title.trim(), uniqueSlug, summary.trim(), content.trim(), parseInt(category_id), image_url.trim(), is_featured ? 1 : 0, author ? author.trim() : 'Redaksi Lintas Poin', id]);

    const updatedArticle = await dbGet(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (!updatedArticle) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json(updatedArticle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Article
app.delete('/api/articles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await dbRun(`DELETE FROM articles WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Artikel sukses dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Submit comments
app.post('/api/articles/:id/comments', async (req, res) => {
  const article_id = parseInt(req.params.id);
  const { name, content } = req.body;

  if (!name || !content || name.trim() === '' || content.trim() === '') {
    return res.status(400).json({ error: 'Nama pengirim dan isi komentar wajib diisi' });
  }

  try {
    const article = await dbGet(`SELECT id FROM articles WHERE id = ?`, [article_id]);
    if (!article) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    const { lastID } = await dbRun(`
      INSERT INTO comments (article_id, name, content)
      VALUES (?, ?, ?)
    `, [article_id, name.trim(), content.trim()]);

    const newComment = await dbGet(`SELECT * FROM comments WHERE id = ?`, [lastID]);
    res.json(newComment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Local image upload to disk
app.post('/api/upload', async (req, res) => {
  const { filename, base64 } = req.body;
  if (!base64) {
    return res.status(400).json({ error: 'Data gambar wajib disertakan' });
  }

  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse base64
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let imageBuffer: Buffer;
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      imageBuffer = Buffer.from(base64Data, 'base64');
      const extParts = mimeType.split('/');
      if (extParts.length === 2) {
        extension = extParts[1];
      }
    } else {
      imageBuffer = Buffer.from(base64, 'base64');
    }

    // Generate smart unique file name
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const cleanOrigName = filename
      ? filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'pic';
    
    const finalFilename = `photo_${timestamp}_${randomStr}.${extension}`;
    const filePath = path.join(uploadDir, finalFilename);

    fs.writeFileSync(filePath, imageBuffer);

    res.json({ success: true, url: `/uploads/${finalFilename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USER AUTHENTICATION & MANAGEMENT ENDPOINTS
// ==========================================

// Check if any admin users are registered
app.get('/api/users/count', async (req, res) => {
  try {
    const userCount = await dbGet(`SELECT COUNT(*) as count FROM users`);
    res.json({ count: userCount.count || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register the very first admin user
app.post('/api/users/register-first', async (req, res) => {
  const { username, fullname, password } = req.body;
  
  if (!username || !fullname || !password || username.trim() === '' || fullname.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username, Nama Lengkap, dan Password harus diisi' });
  }

  try {
    const userCount = await dbGet(`SELECT COUNT(*) as count FROM users`);
    if (userCount.count > 0) {
      return res.status(400).json({ error: 'Registrasi mandiri ditutup. Silakan mendaftar melalui akun Redaksi Admin yang terdaftar.' });
    }

    const assignedRole = 'developer'; // Make developer by default for the first user
    const { lastID } = await dbRun(`
      INSERT INTO users (username, fullname, password, role)
      VALUES (?, ?, ?, ?)
    `, [username.trim().toLowerCase(), fullname.trim(), password, assignedRole]);

    const newUser = await dbGet(`SELECT id, username, fullname, role FROM users WHERE id = ?`, [lastID]);
    res.json({ success: true, user: newUser });
  } catch (error: any) {
    if (error.message && error.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Username sudah digunakan' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login Admin User
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username dan Password wajib diisi' });
  }

  try {
    const user = await dbGet(`SELECT id, username, fullname, password, role FROM users WHERE username = ?`, [username.trim().toLowerCase()]);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Username atau Password salah' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role || 'redaktur'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin registers other admin accounts
app.post('/api/users/create', async (req, res) => {
  const { username, fullname, password, role, creator_role } = req.body;

  if (!username || !fullname || !password || username.trim() === '' || fullname.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username, Nama Lengkap, dan Password wajib diisi' });
  }

  try {
    const existing = await dbGet(`SELECT id FROM users WHERE username = ?`, [username.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'Username tersebut sudah terdaftar' });
    }

    if (role === 'developer' && creator_role !== 'developer') {
      return res.status(403).json({ error: 'Hanya akun Developer yang dapat mendaftarkan akun Developer baru' });
    }

    const assignedRole = role || 'redaktur';
    await dbRun(`
      INSERT INTO users (username, fullname, password, role)
      VALUES (?, ?, ?, ?)
    `, [username.trim().toLowerCase(), fullname.trim(), password, assignedRole]);

    res.json({ success: true, message: 'Akun redaktur baru berhasil terdaftar' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all admin users list
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbAll(`SELECT id, username, fullname, role, created_at FROM users ORDER BY created_at DESC`);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Stats and charting aggregates for local reporting
app.get('/api/stats', async (req, res) => {
  try {
    const articleCount = await dbGet(`SELECT COUNT(*) as count FROM articles`);
    const commentCount = await dbGet(`SELECT COUNT(*) as count FROM comments`);
    const viewCount = await dbGet(`SELECT SUM(views) as count FROM articles`);

    const categoryBreakdown = await dbAll(`
      SELECT c.name as category, SUM(a.views) as views, COUNT(a.id) as count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id
    `);

    res.json({
      totalArticles: articleCount.count || 0,
      totalComments: commentCount.count || 0,
      totalViews: viewCount.count || 0,
      categoryStats: categoryBreakdown.map(stat => ({
        category: stat.category,
        views: stat.views || 0,
        count: stat.count || 0
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Hard database reset, rebuilding starting state
app.post('/api/db/reset', async (req, res) => {
  try {
    await dbRun(`DROP TABLE IF EXISTS comments`);
    await dbRun(`DROP TABLE IF EXISTS articles`);
    await dbRun(`DROP TABLE IF EXISTS categories`);
    await dbRun(`DROP TABLE IF EXISTS users`);
    await initDatabase();
    res.json({ success: true, message: 'Database Lintas Poin sukses diatur ulang' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

let globalViteInstance: any = null;

interface PageMetadata {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

async function handleServeHtml(req: any, res: any, meta: PageMetadata) {
  let templatePath = '';
  let html = '';
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    templatePath = path.resolve(process.cwd(), 'index.html');
    if (fs.existsSync(templatePath)) {
      html = fs.readFileSync(templatePath, 'utf-8');
      if (globalViteInstance) {
        html = await globalViteInstance.transformIndexHtml(req.originalUrl, html);
      }
    }
  } else {
    templatePath = path.resolve(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(templatePath)) {
      html = fs.readFileSync(templatePath, 'utf-8');
    }
  }

  if (!html) {
    return res.status(500).send('HTML template not found');
  }

  // Escape special chars to prevent syntax issues
  const escapeHtml = (text: string) => {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeImg = meta.imageUrl;
  const safeUrl = meta.url;

  // Build the rich social media preview metadata
  const metaTags = `
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  
  <!-- Schema.org markup for Google+ / Search -->
  <meta itemprop="name" content="${safeTitle}">
  <meta itemprop="description" content="${safeDesc}">
  <meta itemprop="image" content="${safeImg}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:site_name" content="Lintas Poin" />
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />
  `;

  // Ganti tag <title> di index.html dengan meta tags lengkap kita
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/, metaTags);
  } else {
    html = html.replace('</head>', `${metaTags}\n</head>`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Tangani rute detail berita khusus agar memiliki metadata WhatsApp preview
app.get('/article/:slug', async (req, res, next) => {
  const { slug } = req.params;
  try {
    const article = await dbGet(`
      SELECT a.*, c.name as category_name
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ?
    `, [slug]);

    if (!article) {
      return next(); // Jika tidak ada artikel, teruskan ke default router
    }

    // Tentukan URL absolut untuk artikel dan gambar
    const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const host = req.get('host');
    
    let domainUrl = process.env.APP_URL;
    if (!domainUrl || domainUrl === 'MY_APP_URL' || domainUrl.includes('MY_APP_URL') || !domainUrl.startsWith('http')) {
      domainUrl = `${protocol}://${host}`;
    }
    domainUrl = domainUrl.replace(/\/+$/, '');
    
    const cleanSlug = article.slug.startsWith('/') ? article.slug.substring(1) : article.slug;
    const articleUrl = `${domainUrl}/article/${cleanSlug}`;
    
    // Pastikan image_url adalah absolut
    let imageUrl = article.image_url;
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      const cleanImgPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      imageUrl = `${domainUrl}/${cleanImgPath}`;
    }

    // Batasi teks deskripsi agar ringkas (maksimal 150 karakter untuk preview)
    const rawSummary = article.summary || article.content || '';
    const cleanSummary = rawSummary
      .replace(/[#*`>_\-]/g, '') // bersihkan markdown
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 150) + (rawSummary.length > 150 ? '...' : '');

    const metadata: PageMetadata = {
      title: `${article.title} - Lintas Poin`,
      description: cleanSummary,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200',
      url: articleUrl,
    };

    await handleServeHtml(req, res, metadata);
  } catch (error) {
    console.error('Error serving article with metadata:', error);
    next();
  }
});

// Tangani rute beranda / agar metadata WhatsApp preview untuk link induk muncul
app.get(['/', '/admin'], async (req, res, next) => {
  try {
    // Ambil setting site_title dan site_tagline
    const siteTitleCheck = await dbGet(`SELECT value FROM settings WHERE key = 'site_title'`);
    const siteTaglineCheck = await dbGet(`SELECT value FROM settings WHERE key = 'site_tagline'`);
    
    const siteTitle = siteTitleCheck ? siteTitleCheck.value : 'Lintas Poin';
    const siteTagline = siteTaglineCheck ? siteTaglineCheck.value : 'Redaksi Independen Lintas Poin • Media Siber & Pers';

    const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const host = req.get('host');
    
    let domainUrl = process.env.APP_URL;
    if (!domainUrl || domainUrl === 'MY_APP_URL' || domainUrl.includes('MY_APP_URL') || !domainUrl.startsWith('http')) {
      domainUrl = `${protocol}://${host}`;
    }
    domainUrl = domainUrl.replace(/\/+$/, '');

    // Kita bisa cari artikel unggulan pertama (featured) untuk dijadikan gambar banner pembuka induk
    const featuredArticle = await dbGet(`
      SELECT image_url FROM articles 
      WHERE is_featured = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    let bannerUrl = featuredArticle ? featuredArticle.image_url : null;
    if (!bannerUrl) {
      const latestArticle = await dbGet(`SELECT image_url FROM articles ORDER BY created_at DESC LIMIT 1`);
      bannerUrl = latestArticle ? latestArticle.image_url : null;
    }

    if (bannerUrl && !bannerUrl.startsWith('http://') && !bannerUrl.startsWith('https://')) {
      const cleanBannerPath = bannerUrl.startsWith('/') ? bannerUrl.substring(1) : bannerUrl;
      bannerUrl = `${domainUrl}/${cleanBannerPath}`;
    }

    const finalBanner = bannerUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200';

    const metadata: PageMetadata = {
      title: siteTitle,
      description: siteTagline,
      imageUrl: finalBanner,
      url: domainUrl,
    };

    await handleServeHtml(req, res, metadata);
  } catch (error) {
    console.error('Error serving homepage with metadata:', error);
    next();
  }
});

// Serve frontend routing and build integration
async function startServer() {
  // Vite integration middleware in non-production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    globalViteInstance = vite;
    app.use(vite.middlewares);
    console.log('Vite development server middleware loaded.');
  } else {
    // Serve static compiled UI files in production environment
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('Serving production bundles static folder from /dist');
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lintas Poin local offline server active on: http://localhost:${PORT}`);
  });
}

startServer();
