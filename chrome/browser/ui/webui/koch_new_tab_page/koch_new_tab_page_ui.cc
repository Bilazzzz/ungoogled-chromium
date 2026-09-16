// Copyright 2024 Koch Browser Developers. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "chrome/browser/ui/webui/koch_new_tab_page/koch_new_tab_page_ui.h"

#include "base/memory/weak_ptr.h"
#include "chrome/browser/ui/webui/koch_new_tab_page/koch_new_tab_page_handler.h"
#include "chrome/grit/chrome_browser_koch_new_tab_page_header.h"
#include "components/grit/components_scaled_resources.h"
#include "content/public/browser/url_data_source.h"
#include "content/public/browser/web_contents.h"
#include "content/public/browser/web_ui.h"
#include "content/public/browser/web_ui_data_source.h"
#include "content/public/browser/web_ui_message_handler.h"
#include "net/base/data_url.h"
#include "ui/base/resource/resource_bundle.h"

namespace {

constexpr char kChromeUIKochNewTabHost[] = "koch-new-tab-page";

}  // namespace

KochNewTabPageUI::KochNewTabPageUI(content::WebUI* web_ui)
    : content::WebUIController(web_ui) {
  content::WebUIDataSource* source =
      content::WebUIDataSource::Create(kChromeUIKochNewTabHost);

  source->SetDefaultResource(IDR_KOCH_NEW_TAB_PAGE_HTML);
  source->AddResourcePath("koch_new_tab_page.css", IDR_KOCH_NEW_TAB_PAGE_CSS);
  source->AddResourcePath("koch_new_tab_page.js", IDR_KOCH_NEW_TAB_PAGE_JS);

  source->SetContentSecurityPolicy(
      "script-src 'self' 'unsafe-inline' https://fonts.cdnfonts.com; "
      "object-src 'self'; "
      "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com;");

  content::WebUIDataSource::Add(web_ui->GetWebContents()->GetBrowserContext(),
                                source);

  auto* handler = new KochNewTabPageHandler(web_ui);
  web_ui->RegisterMessageCallback(
      "initialized",
      base::BindRepeating(&KochNewTabPageHandler::HandleInitialized,
                          base::Unretained(handler)));
  web_ui->RegisterMessageCallback(
      "getSettings",
      base::BindRepeating(&KochNewTabPageHandler::HandleGetSettings,
                          base::Unretained(handler)));
  web_ui->RegisterMessageCallback(
      "saveSettings",
      base::BindRepeating(&KochNewTabPageHandler::HandleSaveSettings,
                          base::Unretained(handler)));
  web_ui->RegisterMessageCallback(
      "getBookmarks",
      base::BindRepeating(&KochNewTabPageHandler::HandleGetBookmarks,
                          base::Unretained(handler)));
  web_ui->RegisterMessageCallback(
      "searchSuggestions",
      base::BindRepeating(&KochNewTabPageHandler::HandleSearchSuggestions,
                          base::Unretained(handler)));
}

KochNewTabPageUI::~KochNewTabPageUI() = default;

WEB_UI_CONTROLLER_FACTORY_IMPL(KochNewTabPageUI, kChromeUIKochNewTabHost)
