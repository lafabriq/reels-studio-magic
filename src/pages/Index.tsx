const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Logo top-left */}
      <header className="absolute top-0 left-0 p-6">
        <span className="text-sm font-semibold text-foreground tracking-widest lowercase select-none">
          la content fabrique
        </span>
      </header>

      {/* Center */}
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-5xl font-bold text-foreground tracking-widest lowercase">
          la content fabrique
        </h1>
      </div>
    </div>
  );
};

export default Index;
