#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
audio_root="${project_root}/public/audio/RSB"

if ! command -v ffmpeg >/dev/null 2>&1; then
	echo "ffmpeg is required to generate Opus preview files." >&2
	exit 1
fi

find "${audio_root}" -type f -name '*.wav' -print0 |
	while IFS= read -r -d '' wav_file; do
		opus_file="${wav_file%.wav}.opus"
		if [[ ! -f "${opus_file}" || "${wav_file}" -nt "${opus_file}" ]]; then
			echo "Encoding ${wav_file#${project_root}/}"
			ffmpeg \
				-hide_banner \
				-loglevel error \
				-y \
				-i "${wav_file}" \
				-map_metadata -1 \
				-c:a libopus \
				-application audio \
				-b:a 64k \
				-vbr on \
				-compression_level 10 \
				"${opus_file}"
		fi

		spectrogram_file="${wav_file%.wav}.spectrogram.avif"
		if [[ ! -f "${spectrogram_file}" || "${wav_file}" -nt "${spectrogram_file}" ]]; then
			echo "Rendering ${spectrogram_file#${project_root}/}"
			ffmpeg \
				-hide_banner \
				-loglevel error \
				-y \
				-i "${wav_file}" \
				-lavfi "showspectrumpic=s=1400x504:legend=disabled:scale=log:color=intensity" \
				-frames:v 1 \
				-c:v libsvtav1 \
				-preset 10 \
				-crf 37 \
				-pix_fmt yuv420p10le \
				-svtav1-params log=0 \
				-f avif \
				"${spectrogram_file}" \
				2>/dev/null
		fi

		rm -f "${wav_file%.wav}.spectrogram.jpg" "${wav_file%.wav}.spectrogram-q"{1,2,3,4,5}.{jpg,avif}
	done

echo "Opus previews and highest-resolution static spectrograms are up to date."
