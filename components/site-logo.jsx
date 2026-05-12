import Link from "next/link";
import { PawLogoIcon } from "@/components/icons";

export default function SiteLogo({
  href = "/",
  variant = "landing",
  tag = "Premium",
  sidebar = false,
  className = "",
}) {
  const sidebarClass = sidebar ? " petcare-logo--sidebar" : "";

  return (
    <Link
      href={href}
      className={`petcare-logo petcare-logo--${variant}${sidebarClass} ${className}`.trim()}
      aria-label={`MyPuppy ${tag}`}
    >
      <span className="petcare-logo__icon" aria-hidden="true">
        <PawLogoIcon className="h-[1.55rem] w-[1.55rem]" />
      </span>
      <span className="petcare-logo__copy">
        <span className="petcare-logo__wordmark">
          <span className="petcare-logo__pet">My</span>
          <span className="petcare-logo__care">Puppy</span>
        </span>
        <span className="petcare-logo__tag">{tag}</span>
      </span>
    </Link>
  );
}

