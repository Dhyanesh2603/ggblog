import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';

export const WriterProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, toggleFollowProfile, works, setActiveWorkId, userRole } = useNovel();
  const [isEditing, setIsEditing] = useState(false);

  // Form states for profile editing
  const [name, setName] = useState(profile.name);
  const [penName, setPenName] = useState(profile.penName || '');
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [manifesto, setManifesto] = useState(profile.manifesto || profile.philosophy || '');

  const publishedWorks = works.filter((w) => w.status === 'published');
  const totalWords = works.reduce(
    (sum, w) => sum + (w.wordCount || w.chapters.reduce((csum, ch) => csum + (ch.wordCount || 0), 0)),
    0
  );
  const followerDisplay = profile.followerCount || profile.followersCount || 1480;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || profile.name,
      penName: penName.trim() || undefined,
      bio: bio.trim() || profile.bio,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      manifesto: manifesto.trim() || undefined,
      philosophy: manifesto.trim() || profile.philosophy
    });
    setIsEditing(false);
  };

  const handleReadWork = (workId: string) => {
    setActiveWorkId(workId);
    navigate('/novel');
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] pb-32">
      {/* 1. PROFILE HEADER SECTION */}
      <section className="border-b border-[var(--border)] bg-[var(--paper-tint)]/40 py-16">
        <div className="editorial-container">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
            {/* Left: Avatar Monogram & Bio */}
            <div className="flex flex-col sm:flex-row items-start gap-8 max-w-2xl">
              {/* Monogram Block */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 border border-[var(--text)] flex items-center justify-center bg-[var(--bg)] shadow-xs shrink-0">
                <span className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)] italic">
                  {profile.name.charAt(0)}
                </span>
              </div>

              {/* Identity & Metadata */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  <span>※</span>
                  <span>Author & Essayist</span>
                  {profile.location && (
                    <>
                      <span className="opacity-40">/</span>
                      <span>{profile.location}</span>
                    </>
                  )}
                </div>

                <h1 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)] tracking-tight">
                  {profile.name}
                </h1>

                {profile.penName && (
                  <p className="font-editorial-body text-sm text-[var(--text-muted)] italic">
                    Writing as {profile.penName}
                  </p>
                )}

                <p className="font-editorial-body text-base text-[var(--text-muted)] leading-relaxed pt-1">
                  {profile.bio}
                </p>

                {profile.website && (
                  <p className="font-mono-meta text-[10.5px] text-[var(--text-faint)]">
                    Atelier: <span className="text-[var(--text)] underline">{profile.website}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Social & Profile Actions */}
            <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
              <div className="flex items-center gap-3">
                {/* Follow Button */}
                <button
                  type="button"
                  onClick={toggleFollowProfile}
                  className={`font-mono-meta text-xs tracking-[0.16em] px-5 py-2.5 transition-all cursor-pointer ${
                    profile.isFollowing
                      ? 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)]'
                  }`}
                >
                  {profile.isFollowing ? '✓ FOLLOWING' : '+ FOLLOW WRITER'}
                </button>

                {/* Edit Profile Button (Visible to writer) */}
                {userRole === 'writer' && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    {isEditing ? 'CANCEL EDIT' : 'EDIT PROFILE'}
                  </button>
                )}
              </div>

              <div className="font-mono-meta text-[11px] text-[var(--text-muted)] tracking-wider">
                <span className="font-semibold text-[var(--text)]">{followerDisplay.toLocaleString()}</span> readers following
              </div>
            </div>
          </div>

          {/* EDIT PROFILE FORM MODAL / COLLAPSIBLE */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-10 p-6 sm:p-8 border border-[var(--border)] bg-[var(--bg)] max-w-2xl space-y-4"
            >
              <h2 className="font-editorial-title text-2xl text-[var(--text)] border-b border-[var(--border)] pb-3">
                Update Author Portfolio
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-xs font-mono-meta text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                    PEN NAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-xs font-mono-meta text-[var(--text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                  BIOGRAPHICAL STATEMENT
                </label>
                <textarea
                  value={bio}
                  rows={3}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-sm font-editorial-body text-[var(--text)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                    LOCATION
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-xs font-mono-meta text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                    ATELIER / WEBSITE
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-xs font-mono-meta text-[var(--text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1">
                  EDITORIAL PHILOSOPHY & MANIFESTO
                </label>
                <textarea
                  value={manifesto}
                  rows={3}
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] p-2 text-sm font-editorial-body text-[var(--text)]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 cursor-pointer"
                >
                  SAVE PORTFOLIO
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2 border border-[var(--border)] cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          {/* 2. STATS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 mt-10 border-t border-[var(--border)]/70">
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                PUBLISHED TITLES
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {publishedWorks.length}
              </div>
            </div>
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                TOTAL WORDS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {totalWords.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                ACTIVE YEARS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                2024—2026
              </div>
            </div>
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                PRINT EDITIONS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                Typeset A5
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EDITORIAL PHILOSOPHY & MANIFESTO */}
      {(profile.manifesto || profile.philosophy) && (
        <section className="editorial-container py-16 border-b border-[var(--border)]">
          <div className="max-w-2xl space-y-4">
            <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase block">
              PUBLISHING MANIFESTO
            </span>
            <blockquote className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] italic leading-snug border-l-2 border-[var(--text)] pl-6 py-1">
              “{profile.manifesto || profile.philosophy}”
            </blockquote>
          </div>
        </section>
      )}

      {/* 4. PUBLISHED WORKS CATALOG */}
      <section className="editorial-container pt-16">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
          <div>
            <span className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">
              BIBLIOGRAPHY
            </span>
            <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)]">
              Authored Works
            </h2>
          </div>
          <Link
            to="/explore"
            className="font-mono-meta text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] underline"
          >
            VIEW ALL COLLECTIONS →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
          {publishedWorks.map((work) => (
            <article
              key={work.id}
              onClick={() => handleReadWork(work.id)}
              className="group border border-[var(--border)] hover:border-[var(--text)] p-6 bg-[var(--bg)] flex flex-col justify-between transition-colors cursor-pointer"
            >
              <div>
                <div className="font-mono-meta text-[9.5px] uppercase tracking-widest text-[var(--text-muted)] pb-3">
                  {work.type.replace('-', ' ')} · {work.year || '2026'}
                </div>
                <h3 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] group-hover:italic transition-all">
                  {work.title}
                </h3>
                {work.subtitle && (
                  <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-1 line-clamp-1">
                    {work.subtitle}
                  </p>
                )}
                <p className="font-editorial-body text-xs text-[var(--text-muted)] line-clamp-2 mt-3 leading-relaxed">
                  {work.synopsis || work.description || work.heroExcerpt}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center justify-between font-mono-meta text-[10px]">
                <span className="text-[var(--text-muted)]">{work.chapters.length} Chapters</span>
                <span className="text-[var(--text)] underline">READ BOOK →</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
