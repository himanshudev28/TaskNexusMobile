package com.tasknexus.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class RssFeed(
    val url: String,
    var title: String = url,
    var articles: List<RssArticle> = emptyList(),
    var loading: Boolean = false,
    var error: String = "",
    var expanded: Boolean = false,
    var lastFetched: Long = 0L
)

data class RssArticle(
    val title: String,
    val link: String,
    val pubDate: String,
    val description: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RSSFeedsScreen() {
    var feeds by remember { mutableStateOf(listOf(
        RssFeed("https://feeds.bbci.co.uk/news/rss.xml", "BBC News"),
        RssFeed("https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", "NY Times")
    )) }
    var inputUrl by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    fun fetchFeed(index: Int) {
        scope.launch {
            feeds = feeds.toMutableList().also { it[index] = it[index].copy(loading = true, error = "") }
            try {
                val result = withContext(Dispatchers.IO) {
                    fetchRssFeed(feeds[index].url)
                }
                feeds = feeds.toMutableList().also {
                    it[index] = it[index].copy(
                        title = result.first,
                        articles = result.second,
                        loading = false,
                        lastFetched = System.currentTimeMillis()
                    )
                }
            } catch (e: Exception) {
                feeds = feeds.toMutableList().also {
                    it[index] = it[index].copy(loading = false, error = e.message ?: "Failed to load")
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Text("RSS Feeds", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
        }

        // Add Feed
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputUrl,
                onValueChange = { inputUrl = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("RSS feed URL...") },
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.RssFeed, null, tint = Warning) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface
                )
            )
            Button(
                onClick = {
                    if (inputUrl.isNotBlank() && feeds.none { it.url == inputUrl }) {
                        val newFeed = RssFeed(inputUrl.trim())
                        val newIndex = feeds.size
                        feeds = feeds + newFeed
                        inputUrl = ""
                        fetchFeed(newIndex)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Icon(Icons.Default.Add, null, Modifier.size(18.dp))
                Spacer(Modifier.width(4.dp))
                Text("Add")
            }
        }

        HorizontalDivider(color = BorderColor, thickness = 1.dp)

        if (feeds.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.RssFeed, null, Modifier.size(48.dp), tint = OnSurface3)
                    Text("No feeds added yet", color = OnSurface3, fontSize = 15.sp)
                    Text("Add a RSS feed URL above", color = OnSurface3, fontSize = 12.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                itemsIndexed(feeds) { index, feed ->
                    FeedCard(
                        feed = feed,
                        onToggle = {
                            feeds = feeds.toMutableList().also {
                                it[index] = it[index].copy(expanded = !it[index].expanded)
                            }
                            if (!feeds[index].expanded && feeds[index].articles.isEmpty() && feeds[index].error.isEmpty()) {
                                // expanded is now false after toggle, so we re-check:
                            }
                            if (feeds[index].expanded && feeds[index].articles.isEmpty()) {
                                fetchFeed(index)
                            }
                        },
                        onRefresh = { fetchFeed(index) },
                        onDelete = { feeds = feeds.toMutableList().also { it.removeAt(index) } }
                    )
                }
            }
        }
    }
}

@Composable
private fun FeedCard(
    feed: RssFeed,
    onToggle: () -> Unit,
    onRefresh: () -> Unit,
    onDelete: () -> Unit
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface2),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Feed Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onToggle)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Warning.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.RssFeed, null, Modifier.size(20.dp), tint = Warning)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            feed.title,
                            color = OnSurface,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            feed.url,
                            color = OnSurface3,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (feed.articles.isNotEmpty()) {
                        AssistChip(
                            onClick = {},
                            label = { Text("${feed.articles.size}", fontSize = 11.sp) },
                            modifier = Modifier.height(24.dp),
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = Info.copy(alpha = 0.15f),
                                labelColor = Info
                            )
                        )
                        Spacer(Modifier.width(4.dp))
                    }
                    IconButton(onClick = onRefresh, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Refresh, null, Modifier.size(16.dp), tint = OnSurface3)
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Delete, null, Modifier.size(16.dp), tint = Danger)
                    }
                    Icon(
                        if (feed.expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        null, Modifier.size(20.dp), tint = OnSurface3
                    )
                }
            }

            AnimatedVisibility(
                visible = feed.expanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column {
                    HorizontalDivider(color = BorderColor, thickness = 1.dp)

                    when {
                        feed.loading -> {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Primary, strokeWidth = 2.dp)
                                    Text("Loading feed...", color = OnSurface3, fontSize = 13.sp)
                                }
                            }
                        }
                        feed.error.isNotEmpty() -> {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.ErrorOutline, null, Modifier.size(18.dp), tint = Danger)
                                Text(feed.error, color = Danger, fontSize = 13.sp)
                            }
                        }
                        feed.articles.isEmpty() -> {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No articles found", color = OnSurface3, fontSize = 13.sp)
                            }
                        }
                        else -> {
                            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                                feed.articles.take(20).forEach { article ->
                                    ArticleRow(article = article, onOpen = {
                                        try {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(article.link)))
                                        } catch (e: Exception) {}
                                    })
                                    HorizontalDivider(
                                        modifier = Modifier.padding(horizontal = 16.dp),
                                        color = BorderColor.copy(alpha = 0.5f),
                                        thickness = 0.5.dp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ArticleRow(article: RssArticle, onOpen: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = article.title,
                color = OnSurface,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            if (article.pubDate.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(article.pubDate, color = OnSurface3, fontSize = 11.sp)
            }
        }
        Spacer(Modifier.width(8.dp))
        OutlinedButton(
            onClick = onOpen,
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
            modifier = Modifier.height(30.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
        ) {
            Text("Open", fontSize = 11.sp)
            Spacer(Modifier.width(2.dp))
            Icon(Icons.Default.OpenInNew, null, Modifier.size(12.dp))
        }
    }
}

private fun fetchRssFeed(feedUrl: String): Pair<String, List<RssArticle>> {
    val encoded = URLEncoder.encode(feedUrl, "UTF-8")
    val apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=$encoded"
    val url = URL(apiUrl)
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = 10000
    conn.readTimeout = 10000

    val response = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    val json = JSONObject(response)

    val feedTitle = json.optJSONObject("feed")?.optString("title") ?: feedUrl
    val items = json.optJSONArray("items") ?: return feedTitle to emptyList()

    val articles = (0 until items.length()).mapNotNull { i ->
        val item = items.optJSONObject(i) ?: return@mapNotNull null
        RssArticle(
            title = item.optString("title", "No title"),
            link = item.optString("link", ""),
            pubDate = item.optString("pubDate", "").take(16),
            description = item.optString("description", "")
        )
    }

    return feedTitle to articles
}
