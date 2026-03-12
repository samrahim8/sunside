export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts?status=confirmed&limit=${limit}&expand=free_web_content`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Beehiiv API error:', response.status, errorData);
      return res.status(response.status).json({ error: 'Failed to fetch posts' });
    }

    const data = await response.json();

    // Transform posts to only include what we need
    const posts = data.data.map(post => ({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      publishedAt: post.publish_date,
      thumbnail: post.thumbnail_url,
      webUrl: post.web_url,
      previewText: post.preview_text,
      content: post.free_web_content?.content || null,
    }));

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Posts fetch error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
