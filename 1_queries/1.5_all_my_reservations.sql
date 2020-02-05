SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties on reservations.property_id = properties.id
  JOIN property_reviews on properties.id= property_reviews.property_id
  WHERE reservations.guest_id = 1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date DESC
  LIMIT 10;



