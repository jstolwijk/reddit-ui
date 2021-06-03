import React, { FC } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams, Redirect, useHistory } from "react-router-dom";
import SubReddit, { fetcher } from "./components/subreddit";
import { Block, Stack } from "./components/Components";

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
  const history = useHistory();
  const { data } = useSWR(`https://www.reddit.com/r/${subRedditName}/comments/${commentsId}.json`, fetcher);

  if (!data) {
    return <div>loading</div>;
  }

  const postData = data[0].data.children[0].data;
  const comments = data[1].data.children.map((c: any) => c.data);

  return (
    <div className="container p-4 mx-auto">
      <Stack>
        <button onClick={history.goBack}>Back</button>
        <Block>
          <div className="px-2 overflow-hidden">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{postData.title}</h1>
            <div className="py-4">
              {postData.post_hint === "image" && <img src={postData.url} alt="Media" />}
              <a href={postData.url}>{postData.url}</a>
            </div>
            <div>{postData.selftext}</div>
          </div>
        </Block>
        <div>
          {comments.map((comment: any) => (
            <Comment comment={comment} depth={1} />
          ))}
        </div>
      </Stack>
    </div>
  );
};

const Comment: FC<any> = ({ comment, depth }) => {
  return (
    <Stack>
      <Block>
        <div>
          <div>
            {comment.body} - <p>{comment.author}</p>
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

export default App;
