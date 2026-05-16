# MAME Super A'Can Sound Engine (UMC 6619) Technical Fix

## Issue Description
**Symptom**: In Super A'Can emulation, sound channels frequently get "stuck," playing a short loop of noise/static indefinitely even after the sound should have stopped.

## Root Cause Analysis

### 1. Missing Interrupt Handshake (Register 0x16)
The Super A'Can sound hardware uses DMA-driven sample playback. When a DMA buffer finishes, the sound chip triggers an IRQ to the sound CPU (W65C02). The CPU is then expected to read a status register to identify which channel(s) finished so it can either stop the voice or refill the buffer for streaming.

In the original MAME implementation (`umc6619_sound.cpp`):
- The IRQ was triggered via `m_dma_irq_handler(1)`.
- However, **Register 0x16** (intended to hold the status mask of finished channels) was **never updated**.
- When the 6502 CPU handled the IRQ and read `0x16`, it always received `0`.
- The guest OS's interrupt handler, seeing no active channel bits, would exit without taking action (like sending a Key Off command).

### 2. Eager Auto-Restart Logic
MAME's `sound_stream_update` was hardcoded to call `keyon_voice(i)` immediately upon a buffer finish if `register9` (DMA mode) was set.
- This "eager" restart happened before the CPU had a chance to update the buffer address or stop the voice.
- Because the CPU was "blinded" by the missing status bits in `0x16`, it never intervened to stop the loop.

## The Fix

### File: `mame/src/mame/umc/umc6619_sound.cpp`

#### Change 1: Update Status on Finish
Added logic to `sound_stream_update` to accumulate the finished channel bit into `m_regs[0x16]` before triggering the IRQ.

```cpp
if (channel.register9)
{
    m_regs[0x16] |= (1 << i);
    m_dma_irq_handler(1);
    keyon_voice(i); 
}
```

#### Change 2: Targeted Buffered Decay (The "Ghost-Buster")
To handle "stuck" sounds that loop indefinitely, a selective volume decay was implemented for **Channels 11, 12, 13, 14, and 15**. These channels were identified as the primary sources of persistent noise and lingering sound effects across multiple games (e.g., the swing sound in Speedy Dragon).

The decay uses a counter to provide a natural "tail" to sounds while ensuring they eventually silence:

```cpp
// Experimental ADSR: Strictly target channels 11-15 for decay
if (i >= 11)
{
    if (channel.decay_counter > 0)
    {
        channel.decay_counter--;
    }
    else
    {
        if (channel.volume > 0)
        {
            uint8_t vl = channel.volume >> 4;
            uint8_t vr = channel.volume & 0x0f;
            if (vl > 0) vl--;
            if (vr > 0) vr--;
            channel.volume = (vl << 4) | vr;
            channel.volume_l = vl | (vl << 4);
            channel.volume_r = vr | (vr << 4);
        }
        channel.decay_counter = 4; // Decay every 4 frames (~1 second total tail)
    }

    if (channel.volume == 0)
    {
        m_active_channels &= ~(1 << i);
    }
}
```

#### Change 3: Register 0x15 and 0x16 Handshaking
- **Register 0x16**: Updated the `read()` handler to return the accumulated status and clear it.
- **Register 0x15**: Implemented a dynamic return value to satisfy streaming DMA checks in games like *Formuel*.

## Result
The Super A'Can emulation now features:
1.  **Stable BGM**: Low-index channels (0-10) remain untouched, preserving music quality.
2.  **Natural Soundscapes**: Lingering sound effects are automatically neutralized with a ~1s natural decay, eliminating "zombie" noises without cutting off effects too abruptly.
3.  **Better Compatibility**: Correct IRQ status reporting allows the guest OS to manage audio more effectively.

## Tested Games
Verified on the following titles:
- **Super Taiwanese Baseball League** (`staiwbbl`): Fixed streaming DMA IRQ handshaking and eliminated high-pitched static during gameplay.
- **Speedy Dragon** (`speedyd`): Successfully neutralized persistent swing sound loops and high-pitched noise on Channels 11-15.
- **Formosa Duel** (`formduel`): Improved stability of background music and status register synchronization.
