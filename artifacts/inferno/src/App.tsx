import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';

import { Layout } from '@/components/Layout';
import Explorer from '@/pages/Explorer';
import Recent from '@/pages/Recent';
import Stats from '@/pages/Stats';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/not-found';

// REQUIRED — resolves the key from window.location.hostname so the same
// build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (intentional), auto-set in prod. Do NOT gate on NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: 'blockButton' as const,
    socialButtonsPlacement: 'top' as const,
  },
  variables: {
    colorPrimary: 'hsl(18, 100%, 52%)',
    colorForeground: 'hsl(0, 0%, 90%)',
    colorMutedForeground: 'hsl(0, 0%, 55%)',
    colorDanger: 'hsl(0, 84%, 60%)',
    colorBackground: 'hsl(0, 0%, 4%)',
    colorInput: 'hsl(0, 0%, 11%)',
    colorInputForeground: 'hsl(0, 0%, 90%)',
    colorNeutral: 'hsl(0, 0%, 15%)',
    fontFamily: "'Outfit', sans-serif",
    borderRadius: '0.375rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'w-[440px] max-w-full overflow-hidden rounded-xl border border-[hsl(0,0%,12%)] shadow-2xl shadow-black/60',
    card: '!shadow-none !border-0 !bg-[hsl(0,0%,4%)] !rounded-none',
    footer: '!shadow-none !border-0 !bg-[hsl(0,0%,4%)] !rounded-none border-t border-[hsl(0,0%,10%)]',
    headerTitle: 'text-[hsl(0,0%,90%)] font-bold font-sans',
    headerSubtitle: 'text-[hsl(0,0%,55%)] font-sans',
    socialButtonsBlockButtonText: 'text-[hsl(0,0%,85%)] font-sans font-medium',
    formFieldLabel: 'text-[hsl(0,0%,75%)] font-sans text-sm',
    footerActionLink: 'text-[hsl(18,100%,52%)] hover:text-[hsl(18,100%,62%)] font-sans',
    footerActionText: 'text-[hsl(0,0%,55%)] font-sans',
    dividerText: 'text-[hsl(0,0%,45%)] font-sans',
    identityPreviewEditButton: 'text-[hsl(18,100%,52%)]',
    formFieldSuccessText: 'text-[hsl(142,71%,55%)]',
    alertText: 'text-[hsl(0,0%,85%)] font-sans',
    logoBox: 'h-10 flex items-center justify-center',
    logoImage: 'h-8 w-auto',
    socialButtonsBlockButton: '!border-[hsl(0,0%,16%)] !bg-[hsl(0,0%,8%)] hover:!bg-[hsl(0,0%,12%)]',
    formButtonPrimary: '!bg-[hsl(18,100%,52%)] hover:!bg-[hsl(18,100%,45%)] !shadow-lg !shadow-[hsl(18,100%,52%,0.2)] font-mono font-semibold tracking-wide',
    formFieldInput: '!bg-[hsl(0,0%,8%)] !border-[hsl(0,0%,15%)] !text-[hsl(0,0%,90%)] font-mono',
    footerAction: '!bg-[hsl(0,0%,4%)]',
    dividerLine: '!bg-[hsl(0,0%,14%)]',
    alert: '!bg-[hsl(0,0%,7%)] !border-[hsl(0,84%,30%)]',
    otpCodeFieldInput: '!bg-[hsl(0,0%,8%)] !border-[hsl(0,0%,18%)] !text-[hsl(0,0%,90%)] font-mono',
    formFieldRow: 'gap-2',
    main: 'gap-4',
  },
};

// Invalidates React Query cache when the signed-in user changes
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/explorer" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/explorer`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/explorer`}
      />
    </div>
  );
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to your Inferno vault',
          },
        },
        signUp: {
          start: {
            title: 'Create your vault',
            subtitle: 'Start storing files with Inferno',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/explorer" component={() => <ProtectedRoute component={Explorer} />} />
            <Route path="/folder/:id" component={() => <ProtectedRoute component={Explorer} />} />
            <Route path="/recent" component={() => <ProtectedRoute component={Recent} />} />
            <Route path="/stats" component={() => <ProtectedRoute component={Stats} />} />
            <Route component={NotFound} />
          </Switch>
          <Toaster theme="dark" position="bottom-right" className="font-mono" />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <Router />
    </WouterRouter>
  );
}

export default App;
