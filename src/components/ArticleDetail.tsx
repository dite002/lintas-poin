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
                className="w-full max-h-[500px] object-cover rounded-xl border border-stone-200 shadow-xs"
              />
              {altText && (
                <span className="block text-center text-xs text-stone-500 font-sans mt-2 font-medium bg-stone-50 px-3 py-1 rounded border border-stone-200/50">
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
            className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-8 mb-4 border-b border-stone-100 pb-1.5"
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
            className="font-serif text-lg sm:text-xl font-bold text-stone-800 mt-6 mb-3"
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
            className="border-l-4 border-stone-900 bg-stone-50 pl-5 pr-4 py-3.5 my-6 italic text-stone-700 font-serif text-sm leading-relaxed"
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
            className="list-disc pl-6 my-4 space-y-2 text-stone-700 text-sm sm:text-base font-sans"
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
        .replace(/`(.*?)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-800 text-xs">$1</code>');

      return (
        <p
          key={idx}
          className="font-sans text-stone-700 leading-relaxed text-sm sm:text-base my-4.5"
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
      className="max-w-3xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-10"
    >
      {/* Back navigation button */}
      <button
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-sans text-xs font-semibold tracking-tight transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Kembali ke Galeri Berita
      </button>

      {/* Header Info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-stone-100 border border-stone-200/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-800">
            {article.category_name}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
          {article.title}
        </h1>

        <div className="mt-2 py-4 border-y border-stone-100 flex flex-wrap items-center gap-y-2 gap-x-5 font-mono text-xs text-stone-500">
          <span className="flex items-center gap-1.5 font-sans font-medium text-stone-800">
            <User className="h-4 w-4 text-stone-400" />
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-stone-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-stone-400" />
            {article.views} Kali dibaca
          </span>
        </div>
      </div>

      {/* Featured Banner Image */}
      <div className="my-6 aspect-video w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200/30">
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
      <div className="prose prose-stone max-w-none prose-sm sm:prose-base">
        {renderMarkdown(article.content)}
      </div>

      {/* Divider */}
      <div className="my-10 border-t border-stone-200"></div>

      {/* Comments Session */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-stone-800" />
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Opini & Komentar ({comments.length})
          </h2>
        </div>

        {/* Form Submission */}
        <form onSubmit={handleCommentSubmit} className="bg-stone-50 rounded-xl p-5 border border-stone-200/50 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 font-sans text-xs font-bold text-stone-800">
            <MessageSquarePlus className="h-4 w-4 text-stone-600" />
            <span>Bagikan Opini Anda</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="cmt-name" className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Nama Lengkap
              </label>
              <input
                id="cmt-name"
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="cth: Ahmad Fauzi"
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 transition-all placeholder:text-stone-400"
              />
            </div>

            <div>
              <label htmlFor="cmt-content" className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Isi Komentar
              </label>
              <textarea
                id="cmt-content"
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Bagikan opini konstruktif Anda terkait berita ini..."
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 transition-all placeholder:text-stone-400 resize-none"
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
            className="self-end rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-4 py-2 font-sans text-xs font-semibold text-stone-100 tracking-tight transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </form>

        {/* Comment Render Feed */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200">
              <p className="font-sans text-xs text-stone-500">
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
                  className="p-4 border border-stone-200/80 bg-stone-50/20 rounded-xl"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-sans text-sm font-bold text-stone-900">
                      {comment.name}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {commentDate}
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
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
