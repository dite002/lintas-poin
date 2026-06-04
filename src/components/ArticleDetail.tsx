import React, { useState } from 'react';
import { ArticleWithCategory, Comment } from '../types';
import { ArrowLeft, Calendar, Eye, User, MessageSquarePlus, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface ArticleDetailProps {
  article: ArticleWithCategory;
  comments: Comment[];
  onBack: () => void;
  onSubmitComment: (name: string, content: string) => Promise<void>;
}

export default function ArticleDetail({
  article,
  comments,
  onBack,
  onSubmitComment,
}: ArticleDetailProps) {
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const getFullShareUrl = () => {
    const origin = window.location.origin;
    return `${origin}/article/${article.slug}`;
  };

  const handleCopyLink = () => {
    const shareUrl = getFullShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Gagal menyalin tautan:', err);
    });
  };

  const handleShareWhatsApp = () => {
    const shareUrl = getFullShareUrl();
    const text = `*${article.title}*\n\nBaca selengkapnya di Lintas Poin:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const formattedDate = new Date(article.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim()) {
      setErrorMsg('Nama dan isi komentar wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onSubmitComment(commentName, commentContent);
      setCommentContent('');
      setSuccessMsg('Komentar Anda berhasil terkirim!');
      // Disappear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirimkan komentar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe and clean localized parser for Markdown structures
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const blocks = text.split('\n\n');

    return blocks.map((rawBlock, idx) => {
      const block = rawBlock.trim();
      if (!block) return null;

      // Handle Image Markdown block: ![Deskripsi](src URL atau data URL)
      if (block.startsWith('![') && block.includes('](')) {
        const match = block.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          const altText = match[1];
          const srcUrl = match[2];
          return (
            <div key={idx} className="my-6 flex flex-col items-center">
              <img
                src={srcUrl}
                alt={altText}
                referrerPolicy="no-referrer"
                className="w-full max-h-[500px] object-cover rounded-xl border border-slate-200 shadow-xs"
              />
              {altText && (
                <span className="block text-center text-xs text-slate-500 font-sans mt-2 font-medium bg-slate-50 px-3 py-1 rounded border border-slate-200/50">
                  📷 {altText}
                </span>
              )}
            </div>
          );
        }
      }

      // Handle Headers H3
      if (block.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="font-serif text-xl sm:text-2xl font-bold text-blue-900 mt-8 mb-4 border-b border-slate-100 pb-1.5"
          >
            {block.substring(4)}
          </h3>
        );
      }

      // Handle Headers H4
      if (block.startsWith('#### ')) {
        return (
          <h4
            key={idx}
            className="font-serif text-lg sm:text-xl font-bold text-orange-600 mt-6 mb-3"
          >
            {block.substring(5)}
          </h4>
        );
      }

      // Handle Blockquotes
      if (block.startsWith('> ')) {
        const cleanedQuote = block.replace(/^>\s+/, '').replace(/^["'“”‘]/g, '').replace(/["'“”‘]$/g, '');
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-blue-600 bg-slate-50 pl-5 pr-4 py-3.5 my-6 italic text-slate-700 font-serif text-sm leading-relaxed"
          >
            "{cleanedQuote}"
          </blockquote>
        );
      }

      // Handle Lists
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const lines = block.split('\n');
        return (
          <ul
            key={idx}
            className="list-disc pl-6 my-4 space-y-2 text-slate-700 text-sm sm:text-base font-sans"
          >
            {lines.map((line, lidx) => {
              const cleanedLine = line
                .replace(/^[\-\*]\s+/, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              return (
                <li
                  key={lidx}
                  dangerouslySetInnerHTML={{ __html: cleanedLine }}
                ></li>
              );
            })}
          </ul>
        );
      }

      // Default paragraph (supports inline bold **text** and italic *text*)
      const parsedHTML = block
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-orange-600 text-xs">$1</code>');

      return (
        <p
          key={idx}
          className="font-sans text-slate-700 leading-relaxed text-sm sm:text-base my-4.5"
          dangerouslySetInnerHTML={{ __html: parsedHTML }}
        ></p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10"
    >
      {/* Back navigation button */}
      <button
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-slate-500 hover:text-blue-900 font-sans text-xs font-semibold tracking-tight transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Kembali ke Galeri Berita
      </button>

      {/* Header Info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 border border-slate-200/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-600">
            {article.category_name}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-blue-900 leading-tight">
          {article.title}
        </h1>

        <div className="mt-2 py-4 border-y border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 font-mono text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-sans font-medium text-orange-600">
              <User className="h-4 w-4 text-slate-400" />
              {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-slate-400" />
              {article.views} Kali dibaca
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 rounded-lg text-xs font-semibold font-sans border border-emerald-100 transition-colors cursor-pointer"
              title="Bagikan ke WhatsApp"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
              </svg>
              <span>Bagikan</span>
            </button>
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border transition-colors cursor-pointer ${
                copied
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                )}
              </svg>
              <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Banner Image */}
      <div className="my-6 aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/30">
        <img
          src={article.image_url}
          alt={article.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200';
          }}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content Rendering */}
      <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
        {renderMarkdown(article.content)}
      </div>

      {/* Divider */}
      <div className="my-10 border-t border-slate-200"></div>

      {/* Comments Session */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-orange-600" />
          <h2 className="font-serif text-xl font-bold text-blue-900">
            Opini & Komentar ({comments.length})
          </h2>
        </div>

        {/* Form Submission */}
        <form onSubmit={handleCommentSubmit} className="bg-slate-50 rounded-xl p-5 border border-slate-200/50 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-sans text-xs font-bold text-orange-600">
            <MessageSquarePlus className="h-4 w-4 text-slate-600" />
            <span>Bagikan Opini Anda</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="cmt-name" className="block font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Nama Lengkap
              </label>
              <input
                id="cmt-name"
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="cth: Ahmad Fauzi"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-blue-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label htmlFor="cmt-content" className="block font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Isi Komentar
              </label>
              <textarea
                id="cmt-content"
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Bagikan opini konstruktif Anda terkait berita ini..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-blue-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="font-sans text-xs font-semibold text-red-600">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="font-sans text-xs font-semibold text-emerald-600">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="self-end rounded-lg bg-blue-600 border border-blue-700 hover:bg-blue-700 px-4 py-2 font-sans text-xs font-semibold text-slate-100 tracking-tight transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </form>

        {/* Comment Render Feed */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="font-sans text-xs text-slate-500">
                Belum ada komentar. Jadilah yang pertama berkomentar!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const commentDate = new Date(comment.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={comment.id}
                  className="p-4 border border-slate-200/80 bg-slate-50/20 rounded-xl"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-sans text-sm font-bold text-blue-900">
                      {comment.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {commentDate}
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
