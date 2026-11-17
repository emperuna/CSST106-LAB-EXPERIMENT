import { ArrowRight, ChevronDown } from "@reticle/ui";
import { useRef, type CSSProperties } from "react";
import { useDisclosure } from "../hooks/useDisclosure";
import { usePillIndicator } from "../hooks/usePillIndicator";
import { useScrollTarget } from "../hooks/useScrollTarget";
import { useScrolled } from "../hooks/useScrolled";
import { useActiveSection } from "../hooks/useActiveSection";
import "../styles/site-nav.css";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavLab {
  number: number;
  title: string;
  summary: string;
  href: string;
  thumb: string;
}

interface Props {
  /** The logo as SVG markup drawn in currentColor. */
  logo: { svg: string; mark: string; href: string };
  /** In-page section links, such as "#results". Empty on pages without sections. */
  links: NavLink[];
  labs: NavLab[];
  /** The lab page being shown, so its entry in the menu is marked. */
  currentLab?: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The site bar: a transparent strip with the logo on the left, a soft pill in the centre holding
 * the section links, and the lab pages menu on its own on the right.
 */
export function SiteNavBar({ logo, links, labs, currentLab }: Props) {
  const barRef = useRef<HTMLElement>(null);
  const menu = useDisclosure();
  const ids = links.map((link) => link.href.replace(/^#/, ""));
  const active = useActiveSection(barRef, ids);
  // Once the page scrolls, the wordmark gives way to the mark in a tile.
  const scrolled = useScrolled();
  // A clicked link wins until its glide ends, so the indicator slides straight there.
  const scroll = useScrollTarget();
  const current = scroll.target ?? active;
  const pillRef = useRef<HTMLElement>(null);
  const indicator = usePillIndicator(pillRef, current ? `#${current}` : null);

  return (
    <header
      ref={barRef}
      className="site-nav"
      data-scrolled={scrolled || undefined}
      data-open={menu.open || undefined}
    >
      <div className="site-nav-wrap site-nav-row">
        {/* The wordmark at the top of the page; once scrolled, the mark alone in a tile. */}
        <a
          className="site-nav-logo"
          href={logo.href}
          aria-label="Reticle, home"
          onClick={scroll.onLinkClick}
        >
          <span className="site-nav-wordmark" dangerouslySetInnerHTML={{ __html: logo.svg }} />
          <span className="site-nav-mark">
            <img src={logo.mark} alt="" width="22" height="22" />
          </span>
        </a>

        <nav ref={pillRef} className="site-nav-pill" aria-label="Site">
          <span
            className="site-nav-indicator"
            aria-hidden="true"
            data-visible={indicator.visible || undefined}
            style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
          />
          {links.map((link) => (
            <a
              key={link.href}
              className="site-nav-link"
              href={link.href}
              aria-current={current === link.href.slice(1) ? "location" : undefined}
              onClick={scroll.onLinkClick}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          ref={menu.buttonRef}
          type="button"
          className="site-nav-link site-nav-labs"
          aria-expanded={menu.open}
          aria-controls="labs-menu"
          onClick={menu.toggle}
        >
          Lab pages <span className="site-nav-count">1–7</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>

      <div
        ref={menu.panelRef}
        id="labs-menu"
        className="labs-menu"
        data-open={menu.open || undefined}
        inert={!menu.open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) menu.close();
        }}
      >
        <div className="site-nav-wrap labs-menu-body">
          {links.length > 0 && (
            <nav className="labs-menu-sections" aria-label="Sections">
              {links.map((link) => (
                <a key={link.href} href={link.href} onClick={scroll.onLinkClick}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}
          <ol className="labs-menu-list">
            {labs.map((lab, index) => (
              <li key={lab.number} style={{ "--i": index } as CSSProperties}>
                <a
                  className="lab-entry"
                  href={lab.href}
                  aria-current={lab.number === currentLab ? "page" : undefined}
                >
                  <span className="lab-entry-number">{pad(lab.number)}</span>
                  <img className="lab-entry-thumb" src={lab.thumb} alt="" width="96" height="64" />
                  <span className="lab-entry-text">
                    <strong>{lab.title}</strong>
                    <span>{lab.summary}</span>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </a>
              </li>
            ))}
            <li style={{ "--i": labs.length } as CSSProperties}>
              <a className="lab-entry lab-entry-system" href="/design-system">
                <span className="lab-entry-number">DS</span>
                <span className="lab-entry-thumb lab-entry-mark" aria-hidden="true">
                  <img src={logo.mark} alt="" />
                </span>
                <span className="lab-entry-text">
                  <strong>Reticle design system</strong>
                  <span>Every token and shared component in one place.</span>
                </span>
                <ArrowRight aria-hidden="true" />
              </a>
            </li>
          </ol>
        </div>
      </div>
    </header>
  );
}
