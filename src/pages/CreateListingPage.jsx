import { ArrowLeft, ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { listingsApi, toUploadUrl, ApiError } from '../lib/api.js';

const ROOM_TYPES = ['Single Room', 'Studio', '1BHK', '2BHK', 'Apartment'];

// Swap a photo with its neighbour; index 0 is the listing cover.
function movePhoto(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

const initialForm = {
  title: '',
  type: 'Single Room',
  price: '',
  bedrooms: '1',
  bathrooms: '1',
  areaSqft: '',
  address: '',
  neighborhood: '',
  district: '',
  city: 'Kathmandu',
  description: '',
  amenities: '',
};

export function CreateListingPage({ onNavigate, listingId }) {
  const isEditing = Boolean(listingId);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!listingId) return undefined;
    let cancelled = false;

    listingsApi
      .get(listingId)
      .then(({ listing }) => {
        if (cancelled) return;
        setForm({
          title: listing.title || '',
          type: listing.type || 'Single Room',
          price: String(listing.price ?? ''),
          bedrooms: String(listing.bedrooms ?? '1'),
          bathrooms: String(listing.bathrooms ?? '1'),
          areaSqft: listing.areaSqft ? String(listing.areaSqft) : '',
          address: listing.location?.address || '',
          neighborhood: listing.location?.neighborhood || '',
          district: listing.location?.district || '',
          city: listing.location?.city || 'Kathmandu',
          description: listing.description || '',
          amenities: (listing.amenities || []).join(', '),
        });
        setExistingImages(listing.images || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this listing.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const buildAmenities = () =>
    form.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const buildLocation = () => ({
    address: form.address,
    neighborhood: form.neighborhood,
    district: form.district,
    city: form.city,
  });

  const saveEdits = async () => {
    await listingsApi.update(listingId, {
      title: form.title,
      type: form.type,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      ...(form.areaSqft ? { areaSqft: Number(form.areaSqft) } : {}),
      description: form.description,
      location: buildLocation(),
      amenities: buildAmenities(),
      images: existingImages,
    });
    if (images.length) await listingsApi.addImages(listingId, images);
    onNavigate('details', { id: listingId });
  };

  const createListing = async () => {
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('type', form.type);
    formData.append('price', form.price);
    formData.append('bedrooms', form.bedrooms);
    formData.append('bathrooms', form.bathrooms);
    if (form.areaSqft) formData.append('areaSqft', form.areaSqft);
    if (form.description) formData.append('description', form.description);
    formData.append('location', JSON.stringify(buildLocation()));
    formData.append('amenities', JSON.stringify(buildAmenities()));
    images.forEach((file) => formData.append('images', file));

    await listingsApi.create(formData);
    onNavigate('landlordHome');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await (isEditing ? saveEdits() : createListing());
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setError(err.details.map((detail) => detail.message).join(' '));
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : `Could not ${isEditing ? 'save your changes' : 'create this listing'}.`,
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <EmptyNote>Loading your listing...</EmptyNote>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <BackButton type="button" onClick={() => onNavigate('landlordHome')} aria-label="Back to landlord home">
          <ArrowLeft size={18} />
        </BackButton>
        <div>
          <h1>{isEditing ? 'Edit Listing' : 'Add a New Listing'}</h1>
          <p>
            {isEditing
              ? 'Update the details tenants see. Changes go live as soon as you save.'
              : 'Give tenants the details they need to book a visit with confidence.'}
          </p>
        </div>
      </Header>

      <FormCard as="form" onSubmit={handleSubmit}>
        {error ? <ErrorText role="alert">{error}</ErrorText> : null}

        <FieldGrid>
          <FullWidth>
            <label>Title</label>
            <Input placeholder="e.g. Sunny 2BHK near Patan Durbar Square" value={form.title} onChange={updateField('title')} required />
          </FullWidth>

          <Field>
            <label>Room type</label>
            <Select value={form.type} onChange={updateField('type')}>
              {ROOM_TYPES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>

          <Field>
            <label>Monthly rent (NPR)</label>
            <Input type="number" min="0" placeholder="22000" value={form.price} onChange={updateField('price')} required />
          </Field>

          <Field>
            <label>Bedrooms</label>
            <Input type="number" min="0" value={form.bedrooms} onChange={updateField('bedrooms')} />
          </Field>

          <Field>
            <label>Bathrooms</label>
            <Input type="number" min="0" value={form.bathrooms} onChange={updateField('bathrooms')} />
          </Field>

          <Field>
            <label>Area (sq ft)</label>
            <Input type="number" min="0" placeholder="Optional" value={form.areaSqft} onChange={updateField('areaSqft')} />
          </Field>

          <Field>
            <label>Address</label>
            <Input placeholder="e.g. Mangal Bazaar, Lalitpur" value={form.address} onChange={updateField('address')} required />
          </Field>

          <Field>
            <label>Neighborhood</label>
            <Input placeholder="e.g. Lalitpur" value={form.neighborhood} onChange={updateField('neighborhood')} required />
          </Field>

          <Field>
            <label>District</label>
            <Input placeholder="e.g. Lalitpur" value={form.district} onChange={updateField('district')} required />
          </Field>

          <FullWidth>
            <label>Amenities</label>
            <Input placeholder="Comma separated, e.g. Fiber internet, Bike parking" value={form.amenities} onChange={updateField('amenities')} />
          </FullWidth>

          <FullWidth>
            <label>Description</label>
            <TextArea
              placeholder="Describe the room, natural light, water access, nearby landmarks..."
              value={form.description}
              onChange={updateField('description')}
            />
          </FullWidth>

          <FullWidth>
            <label>Photos</label>
            {existingImages.length ? (
              <>
                <PhotoHint>The first photo is used as the cover across the app.</PhotoHint>
                <PhotoGrid>
                  {existingImages.map((path, index) => (
                    <Photo key={path}>
                      <img src={toUploadUrl(path)} alt="" />
                      {index === 0 ? <CoverTag>Cover</CoverTag> : null}
                      <RemovePhoto
                        type="button"
                        aria-label="Remove this photo"
                        onClick={() => setExistingImages((current) => current.filter((item) => item !== path))}
                      >
                        <X size={14} />
                      </RemovePhoto>
                      <MoveRow>
                        <MoveButton
                          type="button"
                          aria-label="Move photo earlier"
                          disabled={index === 0}
                          onClick={() => setExistingImages((current) => movePhoto(current, index, index - 1))}
                        >
                          <ChevronLeft size={14} />
                        </MoveButton>
                        <MoveButton
                          type="button"
                          aria-label="Move photo later"
                          disabled={index === existingImages.length - 1}
                          onClick={() => setExistingImages((current) => movePhoto(current, index, index + 1))}
                        >
                          <ChevronRight size={14} />
                        </MoveButton>
                      </MoveRow>
                    </Photo>
                  ))}
                </PhotoGrid>
              </>
            ) : null}
            <UploadBox htmlFor="listing-images">
              <ImagePlus size={20} />
              {images.length
                ? `${images.length} photo(s) selected`
                : `Click to ${isEditing ? 'add more photos' : 'choose up to 8 photos'}`}
            </UploadBox>
            <input
              id="listing-images"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              multiple
              hidden
              onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 8))}
            />
          </FullWidth>
        </FieldGrid>

        <Actions>
          <Button type="submit" disabled={submitting}>
            {isEditing
              ? (submitting ? 'Saving...' : 'Save Changes')
              : (submitting ? 'Publishing...' : 'Publish Listing')}
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate('landlordHome')}>
            Cancel
          </Button>
        </Actions>
      </FormCard>
    </Page>
  );
}

const Page = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(6)}`};
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  h1 {
    margin: 0 0 8px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
`;

const FormCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing(3)};
`;

const ErrorText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 6px;

  label {
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 0.88rem;
    font-weight: 900;
  }
`;

const FullWidth = styled(Field)`
  grid-column: 1 / -1;
`;

const Select = styled.select`
  min-height: 46px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
`;

const TextArea = styled.textarea`
  min-height: 120px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: ${({ theme }) => theme.spacing(1.5)};
  resize: vertical;
`;

const EmptyNote = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
  font-weight: 800;
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Photo = styled.div`
  position: relative;
  overflow: hidden;
  height: 90px;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemovePhoto = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.error};
  }
`;

const PhotoHint = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.82rem;
  font-weight: 700;
`;

const CoverTag = styled.span`
  position: absolute;
  top: 6px;
  left: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  padding: 3px 8px;
  font-size: 0.66rem;
  font-weight: 900;
`;

const MoveRow = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.55));
  padding: 6px 0 5px;
`;

const MoveButton = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const UploadBox = styled.label`
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
  font-weight: 800;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;
