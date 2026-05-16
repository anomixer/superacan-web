# Pull Request: Improve UMC6619 Sound Emulation (Super A'Can)

## Summary
This PR improves the UMC6619 sound driver used in the Super A'Can (`supracan`) driver. It addresses the long-standing "Ghost Noise" issue (persistent audio loops) by implementing proper IRQ handshaking and a targeted volume decay mechanism for sound effect channels.

## Key Changes

### 1. Implemented IRQ Status Reporting (Register 0x16)
Previously, the driver triggered DMA interrupts but provided no way for the sound CPU to identify which channel had finished. 
- Modified `sound_stream_update` to accumulate finished channel bits into `m_regs[0x16]`.
- Implemented **Clear-on-Read** logic for Register 0x16, fulfilling the hardware handshake requirement.
- This allows the guest sound CPU to correctly acknowledge and manage finished voices.

### 2. Targeted Volume Decay (Experimental ADSR)
Many Super A'Can games suffer from "zombie" channels that loop indefinitely after an effect is triggered. This is likely due to the hardware's internal ADSR/envelope logic being unimplemented in the current MAME driver.
- Implemented a selective volume decay for high-index channels (**Channels 11 through 15**), which are primarily used for sound effects.
- The decay is buffered (applying every 4 frames), providing a natural ~1 second "tail" to sounds. This eliminates stuck samples while preserving the intended resonance of sound effects like swings or impacts.
- Musical channels (0-10) remain untouched to preserve BGM integrity.

### 3. Register 0x15 Compatibility
- Added a dynamic read handler for Register 0x15. This satisfies streaming DMA status checks in titles like *Formosa Duel* and *Super Taiwanese Baseball League*.

## Impact
- **Fixed Persistent Noise**: Audio "screams" and stuck sound effects are now gracefully handled.
- **Improved Stability**: Correct IRQ handshaking prevents the sound CPU from getting stuck in interrupt loops or failing to update buffers.
- **Natural Soundscape**: The smoothed decay ensures that SFX end naturally rather than cutting off abruptly or looping forever.

## Technical Notes
The decay logic is implemented using a new `decay_counter` in the `acan_channel` struct. This ensures the decay speed is consistent across different system clock rates and independent of audio pitch.

---
*Verified on WASM and Windows builds using multiple Super A'Can titles, including:*
- **Super Taiwanese Baseball League** (`staiwbbl`) - Fixed streaming DMA hangs and noise.
- **Speedy Dragon** (`speedyd`) - Eliminated SFX ghost noise and high-pitched artifacts.
- **Formosa Duel** (`formduel`) - Corrected audio status reporting and loop termination.
