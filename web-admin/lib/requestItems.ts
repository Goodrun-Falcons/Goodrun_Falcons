export type RequestItem = {
  item_type: string;
  quantity: number;
};

export function formatItemsLabel(items: RequestItem[]): string {
  if (items.length === 0) return "No items";
  const [first, ...rest] = items;
  const firstLabel = `${first.item_type} × ${first.quantity}`;
  return rest.length === 0 ? firstLabel : `${firstLabel} +${rest.length} more`;
}

// A request's display title: the org-chosen name, or (for requests created
// before names existed) a summary of its items.
export function requestLabel(request: { name: string | null; request_items: RequestItem[] }): string {
  return request.name?.trim() || formatItemsLabel(request.request_items);
}
