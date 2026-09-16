// Copyright 2024 Koch Browser Developers. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "chrome/browser/ui/webui/koch_new_tab_page/koch_new_tab_page_handler.h"

#include <string>
#include <vector>

#include "base/values.h"
#include "base/json/json_reader.h"
#include "base/json/json_writer.h"
#include "content/public/browser/web_ui.h"
#include "components/prefs/pref_service.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/common/pref_names.h"

KochNewTabPageHandler::KochNewTabPageHandler(content::WebUI* web_ui)
    : content::WebUIMessageHandler(web_ui) {}

KochNewTabPageHandler::~KochNewTabPageHandler() = default;

void KochNewTabPageHandler::HandleInitialized(const base::Value::List& args) {
  AllowJavascript();
}

void KochNewTabPageHandler::HandleGetSettings(const base::Value::List& args) {
  if (args.empty())
    return;
  
  const std::string& callback_id = args[0].GetString();
  
  // Return default settings for now
  base::Value::Dict settings;
  settings.Set("theme", "ocean");
  settings.Set("subtitle", "твоя стартовая страница");
  settings.Set("cityA", "Moscow");
  settings.Set("cityB", "London");
  settings.Set("bgType", "none");
  
  ResolveJavascriptCallback(base::Value(callback_id), settings);
}

void KochNewTabPageHandler::HandleSaveSettings(const base::Value::List& args) {
  if (args.size() < 2)
    return;
  
  // Store settings in prefs
  Profile* profile = Profile::FromWebUI(web_ui());
  if (profile) {
    PrefService* prefs = profile->GetPrefs();
    // Custom prefs would be registered here
  }
}

void KochNewTabPageHandler::HandleGetBookmarks(const base::Value::List& args) {
  if (args.empty())
    return;
  
  const std::string& callback_id = args[0].GetString();
  
  // Return empty bookmarks array for now
  base::Value::List bookmarks;
  ResolveJavascriptCallback(base::Value(callback_id), bookmarks);
}

void KochNewTabPageHandler::HandleSearchSuggestions(const base::Value::List& args) {
  if (args.empty())
    return;
  
  // Suggestions would be fetched from search engine
  base::Value::List suggestions;
  ResolveJavascriptCallback(base::Value(args[0].GetString()), suggestions);
}

void KochNewTabPageHandler::OnJavascriptAllowed() {}

void KochNewTabPageHandler::OnJavascriptDisallowed() {}
