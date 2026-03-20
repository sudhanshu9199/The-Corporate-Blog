export interface Post {
    id: number;
    title: string;
    slug: string;
    content: any;
    status: 'draft' | 'published' | 'archived';
    cover_image_url?: string;
    published_at: string;
}