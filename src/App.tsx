import React, { FC, Suspense, useEffect, useMemo } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, useParams, Redirect, useLocation, Link } from "react-router-dom";
import SubReddit, { fetcher } from "./components/subreddit";
import { Block, Container, ScreenSize, Stack, useScreenSize } from "./components/Components";
import ReactMarkdown from "react-markdown";
import { useLocalStorage } from "./use-local-storage";
import { extractGalleryImagesFromMetaData, ImageGallery } from "./components/image-gallery";

const increment = (number: number | undefined) => (number ?? 0) + 1;

const App = () => {
  return (
    <Router>
      <Container>
        <div className="lg:grid lg:grid-flow-col lg:grid-cols-12 lg:space-x-2 space-y-1">
          <Switch>
            <Route
              path="/r/:subRedditName?"
              render={({ match: { url } }) => (
                <>
                  <Route path={`/r/:subRedditName/comments/:commentsId`}>
                    <Comments />
                  </Route>
                  <Route path="/r/:subRedditName?" exact>
                    <SubReddit />
                  </Route>
                  <Sidebar />
                </>
              )}
            />
            <Route>
              <Redirect to="/r/" />
            </Route>
          </Switch>
        </div>
      </Container>
    </Router>
  );
};

const Sidebar = () => {
  let { subRedditName } = useParams<any>();

  const [value, setNewValue] = useLocalStorage("favorites", {});

  useEffect(() => {
    if (!subRedditName || subRedditName === "comments") {
      return;
    }
    setNewValue({ ...value, [subRedditName]: increment(value[subRedditName]) });

    // eslint tells us to add setNewValue and value to the depenendency list, if we do this the component will get stuck in a rerender loop since value is a complex object
    // eslint-disable-next-line
  }, [subRedditName]);

  const favorites: string[] = useMemo(
    () =>
      Object.keys(value)
        .map((k) => ({ key: k, value: value[k] as number }))
        .sort((a, b) => (a.value > b.value ? -1 : 1))
        .map((e) => e.key)
        .slice(0, 20),
    [value]
  );

  const screenSize = useScreenSize();
  const [expandMedia, setExpandMedia] = useLocalStorage("expandMedia", true);
  return screenSize > ScreenSize.md ? (
    <div className="col-span-2">
      <Settings expandMedia={expandMedia} favorites={favorites} setExpandMedia={setExpandMedia} />
    </div>
  ) : (
    <></>
  );
};

interface SettingsProps {
  expandMedia: boolean;
  setExpandMedia: (bool: boolean) => void;
  favorites: any[];
}

const Settings: FC<SettingsProps> = ({ expandMedia, setExpandMedia, favorites }) => {
  let { subRedditName } = useParams<any>();

  return (
    <div className="sticky top-0">
      <Stack>
        <Block>
          <div>
            <Link to="/">Frontpage</Link>
          </div>
          {subRedditName && (
            <div>
              <Link to={"/r/" + subRedditName}>{subRedditName}</Link>
            </div>
          )}
          <div className="flex flex-col">
            <Toggle id="expand-media" label="Expand media" checked={expandMedia} onToggle={setExpandMedia} />
          </div>
        </Block>
        <Block>
          Your favorite subreddits:
          <ul>
            {favorites.map((favorite) => (
              <li>
                <Link to={"/r/" + favorite} className="text-blue-600">
                  {favorite}
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      </Stack>
    </div>
  );
};

interface ToggleProps {
  id: string;

  label: string;
  checked: boolean;
  onToggle: (newValue: boolean) => void;
}

const Toggle: FC<ToggleProps> = ({ id, label, checked, onToggle }) => {
  const toggleClasses = checked
    ? "absolute block w-4 h-4 mt-1 ml-1 rounded-full shadow inset-y-0 left-0 focus-within:shadow-outline transition-transform duration-300 ease-in-out bg-blue-400 transform translate-x-full"
    : "absolute block w-4 h-4 mt-1 ml-1 bg-white rounded-full shadow inset-y-0 left-0 focus-within:shadow-outline transition-transform duration-300 ease-in-out";

  return (
    <label htmlFor={id} className="mt-3 inline-flex items-center cursor-pointer">
      <span className="relative">
        <span className="block w-10 h-6 bg-gray-300 rounded-full shadow-inner"></span>
        <span className={toggleClasses}>
          <input id={id} type="checkbox" className="absolute opacity-0 w-0 h-0" onClick={() => onToggle(!checked)} />
        </span>
      </span>
      <span className="ml-3 text-sm">{label}</span>
    </label>
  );
};

const Comments = () => {
  let { subRedditName, commentsId } = useParams<any>();
  const { data } = useSWR(`https://www.reddit.com/r/${subRedditName}/comments/${commentsId}.json`, fetcher);

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!data) {
    return <PendingCommentsPage />;
  }

  const postData = data[0].data.children[0].data;
  const comments = data[1].data.children.map((c: any) => c.data);

  const images = extractGalleryImagesFromMetaData({ data: postData });

  return (
    <div className="col-span-10">
      <Container>
        <Stack>
          <Block>
            <div className="px-2 overflow-hidden">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{postData.title}</h1>
              <div className="py-4">
                {postData.post_hint === "image" && <img src={postData.url} alt="Media" />}
                {!postData.selftext && images.length === 0 && <a href={postData.url}>{postData.url}</a>}
                {postData.selftext && (
                  <div>
                    <ReactMarkdown>{postData.selftext}</ReactMarkdown>
                  </div>
                )}
                {images.length > 0 && (
                  <Suspense fallback={<div>Image gallery died</div>}>
                    <ImageGallery imageUrls={images} />
                  </Suspense>
                )}
              </div>
            </div>
          </Block>
          <div>
            {comments.map((comment: any) => (
              <Comment comment={comment} depth={1} />
            ))}
          </div>
        </Stack>
      </Container>
    </div>
  );
};

const Comment: FC<any> = ({ comment, depth }) => {
  return (
    <Stack>
      <Block>
        <div>
          <div>
            <ReactMarkdown>{comment.body}</ReactMarkdown> - <p className="font-semibold">{comment.author}</p>
          </div>
          <div>
            {comment.replies &&
              comment.replies.data.children
                .filter((child: any) => child.kind === "t1") // TODO handle "more" type
                .map((child: any) => <Comment comment={child.data} depth={depth + 1} />)}
          </div>
        </div>
      </Block>
    </Stack>
  );
};

const PendingCommentsPage = () => {
  return (
    <div className="col-span-10">
      <Container>
        <Stack>
          <Block>
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/6"></div>
                  <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                  <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </Block>
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
          <PendingComment />
        </Stack>
      </Container>
    </div>
  );
};

const PendingComment = () => {
  return (
    <Block>
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-2">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/6"></div>
          </div>
        </div>
      </div>
    </Block>
  );
};

export default App;
