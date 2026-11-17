import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { GalleryItem } from '../data/types'
import { useI18n } from '../i18n'

/** Photo grid with a lightbox. The lightbox is a native <dialog>: focus stays inside it and Escape closes it. */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const { t, tl } = useI18n()
  const [index, setIndex] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  const open = index !== null
  const current = open ? items[index] : null

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const close = () => {
    setIndex(null)
    opener.current?.focus()
  }
  const step = (dir: number) => setIndex((i) => (i === null ? i : (i + dir + items.length) % items.length))

  if (!items.length) return null

  return (
    <>
      <ul className="gallery">
        {items.map((item, i) => (
          <li key={item.id} style={{ '--i': i } as CSSProperties}>
            <button
              type="button"
              className="gallery__thumb frame"
              style={{ aspectRatio: `${item.photo.width} / ${item.photo.height}` }}
              aria-label={`${t('history.openPhoto', { n: i + 1 })}. ${tl(item.alt)}`}
              onClick={(e) => {
                opener.current = e.currentTarget
                setIndex(i)
              }}
            >
              <img
                src={item.photo.thumb ?? item.photo.src}
                alt=""
                width={item.photo.width}
                height={item.photo.height}
                loading="lazy"
                decoding="async"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={t('history.gallery')}
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
      >
        {current && (
          <figure>
            <img
              key={current.id}
              src={current.photo.src}
              alt={tl(current.alt)}
              width={current.photo.width}
              height={current.photo.height}
            />
            <figcaption>
              <span>{tl(current.alt)}</span>
              <span className="lightbox__count">{t('history.photoOf', { n: (index ?? 0) + 1, total: items.length })}</span>
            </figcaption>
          </figure>
        )}
        <div className="lightbox__bar">
          <button type="button" onClick={() => step(-1)} aria-label={t('history.prev')}>
            <Chevron dir="left" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t('history.next')}>
            <Chevron dir="right" />
          </button>
          <button type="button" className="lightbox__close" onClick={close}>
            {t('history.close')}
          </button>
        </div>
      </dialog>
    </>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d={dir === 'left' ? 'M10.5 2.5 5 8l5.5 5.5' : 'M5.5 2.5 11 8l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

/** A short muted clip. It never plays by itself: the visitor presses play. */
export function Clip({ item }: { item: GalleryItem }) {
  const { t, tl } = useI18n()
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) void v.play().catch(() => setPlaying(false))
    else v.pause()
  }

  return (
    <figure className="clip frame" style={{ aspectRatio: `${item.photo.width} / ${item.photo.height}` }}>
      <video
        ref={video}
        src={item.video}
        poster={item.photo.src}
        preload="none"
        muted
        loop
        playsInline
        aria-label={tl(item.alt)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="clip__btn" onClick={toggle} aria-pressed={playing}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4.5 2.5v11l9-5.5z" />}
        </svg>
        <span>{playing ? t('history.pause') : t('history.play')}</span>
      </button>
    </figure>
  )
}
