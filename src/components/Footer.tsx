import { Link } from 'react-router-dom'
import { useContent } from '../data/content'
import { useI18n } from '../i18n'
import { Seal } from './ui'

export function Footer() {
  const { t } = useI18n()
  const { settings } = useContent()
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__brand">
          <Link to="/" className="footer__mark" aria-label={t('nav.home')}>
            <Seal size={52} />
          </Link>
          <p>{t('footer.line')}</p>
        </div>
        <nav aria-label={t('footer.pages')}>
          <h2>{t('footer.pages')}</h2>
          <Link to="/history">{t('nav.history')}</Link>
          <Link to="/team">{t('nav.team')}</Link>
          <Link to="/register">{t('nav.register')}</Link>
        </nav>
        <div>
          <h2>{t('footer.follow')}</h2>
          <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer">
            Telegram <span>{settings.telegramHandle}</span>
          </a>
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram <span>{settings.instagramHandle}</span>
          </a>
        </div>
      </div>
      <div className="footer__base">
        <p className="footer__rights">{t('footer.rights')}</p>
      </div>
    </footer>
  )
}
