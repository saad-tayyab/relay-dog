import type { RelayInfo } from '../utils/relay';
import { SectionCard } from './SectionCard';

export function RelayProfile({ info }: { info: RelayInfo }) {
  return (
    <SectionCard className="animate-fade-in">
      <div className="flex items-start gap-5">
        {info.icon && (
          <img
            src={info.icon}
            alt="Relay icon"
            className="w-16 h-16 rounded-xl border border-dark-border object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            {info.name || 'Unknown Relay'}
          </h2>
          {info.description && (
            <p className="text-text-secondary leading-relaxed mb-3">{info.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-text-muted">
            {info.software && (
              <span className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {info.software}
              </span>
            )}
            {info.version && (
              <span className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                v{info.version}
              </span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
