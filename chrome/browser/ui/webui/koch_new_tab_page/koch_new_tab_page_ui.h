// Copyright 2024 Koch Browser Developers. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_UI_H_
#define CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_UI_H_

#include "content/public/browser/web_ui_controller.h"

namespace content {
class WebUI;
}

class KochNewTabPageUI : public content::WebUIController {
 public:
  explicit KochNewTabPageUI(content::WebUI* web_ui);
  ~KochNewTabPageUI() override;

  // disable copy
  KochNewTabPageUI(const KochNewTabPageUI&) = delete;
  KochNewTabPageUI& operator=(const KochNewTabPageUI&) = delete;

 private:
};

#endif  // CHROME_BROWSER_UI_WEBUI_KOCH_NEW_TAB_PAGE_KOCH_NEW_TAB_PAGE_UI_H_
