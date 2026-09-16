// Copyright 2024 Koch Browser Developers. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_HANDLER_H_
#define CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_HANDLER_H_

#include "base/memory/weak_ptr.h"
#include "content/public/browser/web_ui_message_handler.h"

class KochNewTabPageHandler : public content::WebUIMessageHandler {
 public:
  explicit KochNewTabPageHandler(content::WebUI* web_ui);
  ~KochNewTabPageHandler() override;

  KochNewTabPageHandler(const KochNewTabPageHandler&) = delete;
  KochNewTabPageHandler& operator=(const KochNewTabPageHandler&) = delete;

  // Message handlers
  void HandleInitialized(const base::Value::List& args);
  void HandleGetSettings(const base::Value::List& args);
  void HandleSaveSettings(const base::Value::List& args);
  void HandleGetBookmarks(const base::Value::List& args);
  void HandleSearchSuggestions(const base::Value::List& args);

  // content::WebUIMessageHandler:
  void OnJavascriptAllowed() override;
  void OnJavascriptDisallowed() override;

 private:
  base::WeakPtrFactory<KochNewTabPageHandler> weak_factory_{this};
};

#endif  // CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_HANDLER_H_
