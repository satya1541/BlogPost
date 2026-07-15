import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Layout } from './components/layout';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/home';
import Articles from './pages/articles';
import ArticleDetail from './pages/article-detail';
import Topics from './pages/topics';
import Series from './pages/series';
import SeriesDetail from './pages/series-detail';
import Search from './pages/search';
import Newsletter from './pages/newsletter';
import About from './pages/about';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import Resources from './pages/resources';
import FounderStories from './pages/founder-stories';
import FounderStoryDetail from './pages/founder-story-detail';
import BuildInPublic from './pages/build-in-public';
import { Community } from './pages/community';
import { CommunityThread } from './pages/community-thread';
import { AdminDashboard } from './pages/admin/dashboard';
import { AdminCMS } from './pages/admin/cms';
import { AdminEditor } from './pages/admin/editor';
import { Upgrade } from './pages/upgrade';
import ResetPassword from './pages/reset-password';
import Podcasts from './pages/podcasts';
import Videos from './pages/videos';
import Mentorship from './pages/mentorship';
import PandaLabs from './pages/panda-labs';
import CoursesBooks from './pages/courses-books';
import Fellowship from './pages/fellowship';
import Summit from './pages/summit';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
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
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/resources" component={Resources} />
        <Route path="/podcasts" component={Podcasts} />
        <Route path="/videos" component={Videos} />
        <Route path="/mentorship" component={Mentorship} />
        <Route path="/panda-labs" component={PandaLabs} />
        <Route path="/academy" component={CoursesBooks} />
        <Route path="/fellowship" component={Fellowship} />
        <Route path="/summit" component={Summit} />
        <Route path="/founder-stories" component={FounderStories} />
        <Route path="/founder-stories/:slug" component={FounderStoryDetail} />
        <Route path="/build-in-public" component={BuildInPublic} />
        <Route path="/community" component={Community} />
        <Route path="/community/:id" component={CommunityThread} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/cms" component={AdminCMS} />
        <Route path="/admin/editor" component={AdminEditor} />
        <Route path="/upgrade" component={Upgrade} />
        <Route component={NotFound} />
      </Switch>
      </Layout>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
