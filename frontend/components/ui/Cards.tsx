interface CardProps {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
}

export default function Cards({ title, description, link,icon  }: CardProps) {
  return (
    <>
      <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
  <div className="p-6 flex flex-col space-y-3">
    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    <a
      className="mt-2 inline-flex items-center gap-x-1 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition"
      href="/inscription"
    >
      {link}
      <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"></path>
      </svg>
    </a>
  </div>
</div>
    </>
  );
}
