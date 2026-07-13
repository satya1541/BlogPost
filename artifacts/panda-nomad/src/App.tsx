import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from './components/layout';

import Home from './pages/home';
import Articles from './pages/articles';
import ArticleDetail from './pages/article-detail';
import Topics from './pages/topics';
import Series from './pages/series';
import SeriesDetail from './pages/series-detail';
import Search from './pages/search';
import Newsletter from './pages/newsletter';
import About from './pages/about';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/articles" component={Articles} />
        <Route path="/articles/:slug" component={ArticleDetail} />
        <Route path="/topics" component={Topics} />
        <Route path="/series" component={Series} />
        <Route path="/series/:slug" component={SeriesDetail} />
        <Route path="/search" component={Search} />
        <Route path="/newsletter" component={Newsletter} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
