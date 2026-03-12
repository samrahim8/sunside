export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Post ID required' });
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${id}?expand=free_web_content`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Beehiiv API error:', response.status, errorData);
      return res.status(response.status).json({ error: 'Failed to fetch post' });
    }

    const data = await response.json();
    const post = data.data;

    // Debug: return all fields to see what's available
    const result = {
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      publishedAt: post.publish_date,
      thumbnail: post.thumbnail_url,
      webUrl: post.web_url,
      content: post.free_web_content || post.content || null,
      _allFields: Object.keys(post),
    };

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ post: result });
  } catch (error) {
    console.error('Post fetch error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
