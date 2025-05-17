
import Link from 'next/link';
import { PackageSearch, FileText } from 'lucide-react'; // Using PackageSearch as a generic "box/inventory" icon
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle'; 

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <PackageSearch className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Add navigation links here if needed in the future */}
           <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/documentation">
              <FileText className="mr-1 h-4 w-4" />
              Docs
            </Link>
          </Button>
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeToggle /> 
          <Button asChild>
            <Link href="/add-box">Add New Box</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
