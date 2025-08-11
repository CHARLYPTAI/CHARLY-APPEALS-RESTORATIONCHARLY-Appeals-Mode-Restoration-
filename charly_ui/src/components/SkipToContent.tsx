
export function SkipToContent() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-[9999] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:outline-none transition-all duration-200 font-medium text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Skip to main content"
      tabIndex={0}
    >
      Skip to main content
    </a>
  );
}

export default SkipToContent;