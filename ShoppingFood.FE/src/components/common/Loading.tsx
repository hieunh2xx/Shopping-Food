interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ text = 'Äang táº£i...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-300" />
        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent absolute top-0 left-0 animate-spin" />
      </div>
      <p className="text-gray-600 text-sm font-medium">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
