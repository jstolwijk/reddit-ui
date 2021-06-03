import React, { FC } from "react";
import useSWR from "swr";
import { BrowserRouter as Router, Switch, Route, Link, useParams, Redirect, useHistory } from "react-router-dom";
import SubReddit from "./components/subreddit";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

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

  if (!data) {
    return <div>loading</div>;
  }

  const postData = data[0].data.children[0].data;
  const comments = data[1].data.children.map((c: any) => c.data);
  console.log(comments);
  return (
    <div>
      <h1>{postData.title}</h1>
      {postData.post_hint === "image" && <img src={postData.url} alt="Media" />}
      <a href={postData.url}>{postData.url}</a>

      <div>
        {comments.map((comment: any) => (
          <Comment comment={comment} depth={1} />
        ))}
      </div>
    </div>
  );
};

const Comment: FC<any> = ({ comment, depth }) => {
  return (
    <div className="p-2">
      <div>
        {"*".repeat(depth)} {comment.body} - <p>{comment.author}</p>
      </div>
      <div>
        {comment.replies &&
          comment.replies.data.children
            .filter((child: any) => child.kind === "t1") // TODO handle "more" type
            .map((child: any) => <Comment comment={child.data} depth={depth + 1} />)}
      </div>
    </div>
  );
};

export default App;
