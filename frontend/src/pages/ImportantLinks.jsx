import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ExternalLink, Link2, Sparkles } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export default function ImportantLinks() {
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["important-links"],
    queryFn: async () => (await api.get("/important-links")).data,
  });
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div data-testid="important-links-page">
      <PageHeader title="Important Links" subtitle="Essential resources, communities and tools curated for you." />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 glass rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-5">
            <Link2 className="h-10 w-10 text-amber-400/60" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Links Yet</h3>
          <p className="text-slate-500 text-sm max-w-xs">Important links and resources will appear here once added by the team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {links.map((link, idx) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`member-link-${link.id}`}
              onMouseEnter={() => setHoveredId(link.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative overflow-hidden rounded-2xl border border-white/8 transition-all duration-500 hover:border-amber-400/30 hover:shadow-[0_0_40px_rgba(251,191,36,0.07)]"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Glow overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent transition-opacity duration-500 ${hoveredId === link.id ? "opacity-100" : "opacity-0"}`} />

              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-900/50">
                {link.image_path ? (
                  <img
                    src={`${API_BASE}/api/files/${link.image_path}`}
                    alt={link.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="relative">
                      <div className="absolute inset-0 blur-2xl bg-amber-400/20 rounded-full" />
                      <Link2 className="h-12 w-12 text-amber-400/50 relative" />
                    </div>
                  </div>
                )}
                {/* Gradient overlay at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/90 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative p-5 -mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-base leading-tight truncate group-hover:text-amber-300 transition-colors duration-300">
                      {link.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 truncate font-mono-merq">{new URL(link.url).hostname}</p>
                  </div>
                  <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/20 transition-all duration-300">
                    <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors duration-300 group-hover:rotate-[-8deg]" />
                  </div>
                </div>
              </div>

              {/* Animated bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px]">
                <div className={`h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-all duration-700 ${hoveredId === link.id ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
