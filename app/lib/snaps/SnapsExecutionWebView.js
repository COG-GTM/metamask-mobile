///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { createStyles } from './styles';



// @ts-expect-error Types are currently broken for this.
import WebViewHTML from '@metamask/snaps-execution-environments/dist/browserify/webview/index.html';


const styles = createStyles();

// This is a hack to allow us to asynchronously await the creation of the WebView.
// eslint-disable-next-line import/no-mutable-exports
export let createWebView;
// eslint-disable-next-line import/no-mutable-exports
export let removeWebView;












// This is a class component because storing the references we are don't work in functional components.
export class SnapsExecutionWebView extends Component {
  webViews = {};

  constructor(props) {
    super(props);

    createWebView = this.createWebView.bind(this);
    removeWebView = this.removeWebView.bind(this);
  }

  createWebView(jobId) {
    const promise = new Promise((resolve, reject) => {
      const onWebViewLoad = () => {
        const api = {
          injectJavaScript: (js) => {
            this.webViews[jobId]?.ref?.injectJavaScript(js);
          },
          registerMessageListener: (
          listener) =>
          {
            if (this.webViews[jobId]) {
              this.webViews[jobId].listener = listener;
            }
          },
          unregisterMessageListener: (
          _listener) =>
          {
            if (this.webViews[jobId]) {
              this.webViews[jobId].listener = undefined;
            }
          }
        };
        resolve(api);
      };

      const onWebViewMessage = (data) => {
        if (this.webViews[jobId]?.listener) {
          this.webViews[jobId].listener?.(
            data.nativeEvent
          );
        }
      };

      const onWebViewError = (error) => {
        reject(error);
      };

      const setWebViewRef = (ref) => {
        if (this.webViews[jobId]) {
          this.webViews[jobId].ref = ref;
        }
      };

      this.webViews[jobId] = {
        props: {
          onWebViewLoad,
          onWebViewError,
          onWebViewMessage,
          ref: setWebViewRef
        }
      };
    });

    // Force re-render.
    this.forceUpdate();

    return promise;
  }

  removeWebView(jobId) {
    delete this.webViews[jobId];

    // Force re-render.
    this.forceUpdate();
  }

  render() {
    return (
      <View style={styles.container}>
        {Object.entries(this.webViews).map(([key, { props }]) =>
        <WebView
          testID={key}
          key={key}
          ref={props.ref}
          source={{ html: WebViewHTML, baseUrl: 'https://localhost' }}
          onMessage={props.onWebViewMessage}
          onError={props.onWebViewError}
          onLoadEnd={props.onWebViewLoad}
          originWhitelist={['*']}
          javaScriptEnabled />

        )}
      </View>);

  }
}
///: END:ONLY_INCLUDE_IF