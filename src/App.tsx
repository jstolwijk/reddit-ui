import React, { FC, useEffect } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, useParams, Redirect, useLocation } from "react-router-dom";
import SubReddit, { fetcher } from "./components/subreddit";
import { Block, Container, Stack } from "./components/Components";
import ReactMarkdown from "react-markdown";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/r/:subRedditName/comments/:commentsId">
          <Comments />
        </Route>
        <Route path="/r/:subRedditName">
          <SubReddit />
        </Route>
        <Route path="/r/">
          <SubReddit />
        </Route>
        <Route>
          <Redirect to="/r/" />
        </Route>
      </Switch>
    </Router>
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

  return (
    <Container>
      <Stack>
        <Block>
          <div className="px-2 overflow-hidden">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{postData.title}</h1>
            <div className="py-4">
              {postData.post_hint === "image" && <img src={postData.url} alt="Media" />}
              {!postData.selftext && <a href={postData.url}>{postData.url}</a>}
              {postData.selftext && (
                <div>
                  <ReactMarkdown>{postData.selftext}</ReactMarkdown>
                </div>
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
