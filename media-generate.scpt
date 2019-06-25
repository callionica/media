JsOsaDAS1.001.00bplist00�Vscripto; " u s e   s t r i c t " ; 
 O b j C . i m p o r t ( ' F o u n d a t i o n ' ) ; 
 
 v a r   a p p   =   A p p l i c a t i o n . c u r r e n t A p p l i c a t i o n ( ) ; 
 a p p . i n c l u d e S t a n d a r d A d d i t i o n s   =   t r u e ; 
 
 v a r   p a t h   =   $ . N S S t r i n g . a l l o c . i n i t W i t h U T F 8 S t r i n g ( a p p . p a t h T o ( t h i s ) ) . s t r i n g B y D e l e t i n g L a s t P a t h C o m p o n e n t . j s   +   " / " ; 
 
 v a r   f m   =   $ . N S F i l e M a n a g e r . d e f a u l t M a n a g e r ; 
 
 v a r   c r e a t e _ d i r e c t o r y   =   f u n c t i o n   ( p a t h )   { 
 	 v a r   d   =   $ . N S D i c t i o n a r y . a l l o c . i n i t ; 
 	 v a r   u r l   =   $ . N S U R L . a l l o c . i n i t F i l e U R L W i t h P a t h ( p a t h ) ; 
 	 f m . c r e a t e D i r e c t o r y A t U R L W i t h I n t e r m e d i a t e D i r e c t o r i e s A t t r i b u t e s E r r o r ( u r l ,   t r u e ,   d ,   n u l l ) ; 
 } ; 
 
 / /   R e a d   a   U T F 8   f i l e   a t   a   g i v e n   p a t h   a n d   r e t u r n   a   J S   s t r i n g 
 v a r   r e a d _ f i l e   =   f u n c t i o n   ( p a t h )   { 
     v a r   c o n t e n t s   =   f m . c o n t e n t s A t P a t h ( p a t h . t o S t r i n g ( ) ) ;   / /   N S D a t a 
     c o n t e n t s   =   $ . N S S t r i n g . a l l o c . i n i t W i t h D a t a E n c o d i n g ( c o n t e n t s ,   $ . N S U T F 8 S t r i n g E n c o d i n g ) ; 
     r e t u r n   O b j C . u n w r a p ( c o n t e n t s ) ; 
 } ; 
 
 / /   W r i t e   a   U T F 8   f i l e   a t   a   g i v e n   p a t h   g i v e n   a   J S   s t r i n g 
 v a r   w r i t e _ f i l e   =   f u n c t i o n   ( p a t h ,   c o n t e n t s )   { 
 	 v a r   s   =   O b j C . w r a p ( c o n t e n t s ) ; 
 	 s . w r i t e T o F i l e A t o m i c a l l y E n c o d i n g E r r o r ( p a t h . t o S t r i n g ( ) ,   t r u e ,   $ . N S U T F 8 S t r i n g E n c o d i n g ,   n u l l ) ; 
 } ; 
 
 f u n c t i o n   n a m e _ w i t h o u t _ e x t e n s i o n ( n a m e )   { 
 	 v a r   i n d e x   =   n a m e . l a s t I n d e x O f ( " . " ) ; 
 	 i f   ( i n d e x   > =   0 )   { 
 	 	 r e t u r n   n a m e . s u b s t r ( 0 ,   i n d e x ) ; 
 	 } 
 	 r e t u r n   n a m e ; 
 } 
 
 / /   R e t u r n   a n   a r r a y   o f   s t r i n g s   c o n t a i n i n g   t h e   n a m e s   o f   t h e   f i l e s   w i t h i n   t h e   g i v e n   d i r e c t o r y   a n d   s u b d i r e c t o r i e s 
 f u n c t i o n   g e t _ f i l e s ( p a t h )   { 
 
 	 f u n c t i o n   i s _ d i r e c t o r y ( u r l )   { 
 	 	 v a r   v a l u e   =   $ ( ) ; 
 	 	 u r l . g e t R e s o u r c e V a l u e F o r K e y E r r o r ( v a l u e ,   $ . N S U R L I s D i r e c t o r y K e y ,   n u l l ) 
 	 	 r e t u r n   v a l u e . b o o l V a l u e ; 
 	 } 
 	 
 	 f u n c t i o n   g e t _ t y p e ( u r l )   { 
 	 	 v a r   v a l u e   =   $ ( ) ; 
 	 	 u r l . g e t R e s o u r c e V a l u e F o r K e y E r r o r ( v a l u e ,   $ . N S U R L T y p e I d e n t i f i e r K e y ,   n u l l ) 
 	 	 r e t u r n   v a l u e . j s ; 
 	 } 
 
 	 v a r   d i r e c t o r y U R L   =   $ . N S U R L . f i l e U R L W i t h P a t h ( p a t h ) ;   / /   U R L   p o i n t i n g   t o   t h e   d i r e c t o r y   y o u   w a n t   t o   b r o w s e 
 	 v a r   k e y s   =   $ . N S A r r a y . a r r a y W i t h O b j e c t s ( $ . N S U R L I s D i r e c t o r y K e y ,   $ . N S U R L T y p e I d e n t i f i e r K e y ) ; 
 
 	 v a r   e   =   f m . e n u m e r a t o r A t U R L I n c l u d i n g P r o p e r t i e s F o r K e y s O p t i o n s E r r o r H a n d l e r ( d i r e c t o r y U R L ,   k e y s ,   1   < <   2 ,   n u l l ) ; 
 	 	 
 	 v a r   o   =   e . a l l O b j e c t s . j s ; 
 	 
 	 r e t u r n   o . f i l t e r ( u r l   = >   ! i s _ d i r e c t o r y ( u r l ) ) . m a p ( f u n c t i o n   ( u r l )   { 
 	 	 v a r   p a t h   =   u r l . p a t h C o m p o n e n t s . j s . m a p ( c   = >   c . j s ) ; 
 	 	 r e t u r n   { 
 	 	 	 u r l :   u r l . a b s o l u t e S t r i n g . j s , 
 	 	 	 p a t h :   p a t h , 
 	 	 	 p a r e n t :   p a t h [ p a t h . l e n g t h   -   2 ] , 
 	 	 	 n a m e :   n a m e _ w i t h o u t _ e x t e n s i o n ( u r l . l a s t P a t h C o m p o n e n t . j s ) , 
 	 	 	 e x t e n s i o n :   u r l . p a t h E x t e n s i o n . j s , 
 	 	 	 t y p e :   g e t _ t y p e ( u r l ) 
 	 	 } ; 
 	 } ) ; 
 } 
 
 v a r   r e q u i r e   =   f u n c t i o n   ( p a t h )   { 
     v a r   m o d u l e   =   {   e x p o r t s :   { }   } ; 
     v a r   e x p o r t s   =   m o d u l e . e x p o r t s ; 
     e v a l ( r e a d _ f i l e ( p a t h ) ) ; 
 
     r e t u r n   m o d u l e . e x p o r t s ; 
 } ; 
 
 v a r   a l e r t   =   f u n c t i o n   ( t e x t ,   i n f o r m a t i o n a l T e x t )   { 
     v a r   o p t i o n s   =   {   } ; 
     i f   ( i n f o r m a t i o n a l T e x t )   o p t i o n s . m e s s a g e   =   i n f o r m a t i o n a l T e x t ; 
     a p p . d i s p l a y A l e r t ( t e x t ,   o p t i o n s ) ; 
 } ; 
 
 / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / 
 
 O b j C . i m p o r t ( ' A p p K i t ' ) ; 
 
 v a r   w o r k s p a c e   =   $ . N S W o r k s p a c e . s h a r e d W o r k s p a c e ; 
 
 f u n c t i o n   e x t e n s i o n _ f r o m _ t y p e ( t y p e )   { 
 	 v a r   r e s u l t   =   O b j C . u n w r a p ( $ . U T T y p e C o p y P r e f e r r e d T a g W i t h C l a s s ( t y p e ,   $ . k U T T a g C l a s s F i l e n a m e E x t e n s i o n ) ) ; 
 	 r e t u r n   r e s u l t ; 
 } 
 
 f u n c t i o n   i s _ m o v i e ( v a l u e )   { 
 	 v a r   t y p e   =   v a l u e . t y p e   | |   v a l u e ; 
 	 r e t u r n   w o r k s p a c e . t y p e C o n f o r m s T o T y p e ( t y p e ,   $ . k U T T y p e M o v i e ) ; 
 } 
 
 f u n c t i o n   i s _ a u d i o ( v a l u e )   { 
 	 v a r   t y p e   =   v a l u e . t y p e   | |   v a l u e ; 
 	 r e t u r n   w o r k s p a c e . t y p e C o n f o r m s T o T y p e ( t y p e ,   $ . k U T T y p e A u d i o ) ; 
 } 
 
 f u n c t i o n   i s _ i m a g e ( v a l u e )   { 
 	 v a r   t y p e   =   v a l u e . t y p e   | |   v a l u e ; 
 	 r e t u r n   w o r k s p a c e . t y p e C o n f o r m s T o T y p e ( t y p e ,   $ . k U T T y p e I m a g e ) ; 
 } 
 
 f u n c t i o n   i s _ s u b t i t l e ( v a l u e )   { 
 	 v a r   e x t e n s i o n   =   v a l u e . e x t e n s i o n   | |   e x t e n s i o n _ f r o m _ t y p e ( v a l u e . t y p e   | |   v a l u e ) ; 
 	 r e t u r n   [ " s r t " ,   " v t t " ,   " w e b v t t " ] . i n c l u d e s ( e x t e n s i o n . t o L o w e r C a s e ( ) ) ; 
 } 
 
 f u n c t i o n   t a g 2 l a n g ( t a g )   { 
 	 v a r   t   =   t a g . t o L o w e r C a s e ( ) ; 
 	 v a r   d a t a   =   [ 
 	 	 [ " e n " ,   " e n - u s " ,   " e n - g b " ] , 
 	 	 [ " d a " ,   " d a - d k " ,   " d a n s k " ,   " d a n s k 1 " ,   " d a n s k 2 " ,   " k o m m e n t a r " ,   " n o n - d a n s k " ] , 
 	 	 [ " d e " ,   " d e - d e " ,   " d e u t s c h " ,   " g e r m a n " ] , 
 	 	 [ " n o " ,   " n o r s k " ,   " n o r w e g i a n " ] , 
 	 	 [ " s v " ,   " s v - s e " ,   " s e " ,   " s v e n s k a " ,   " s w e d i s h " ] , 
 	 	 [ " f r " ,   " f r a n � a i s " ,   " f r a n c a i s " ,   " f r e n c h " ] , 
 	 	 [ " e s " ,   " e s p a g n o l " ,   " s p a n i s h " ] , 
 	 ] ; 
 
 	 v a r   l a n g ; 
 	 d a t a . s o m e ( f u n c t i o n   ( d )   { 
 	 	 i f   ( d . i n d e x O f ( t )   > =   0 )   { 
 	 	 	 l a n g   =   d [ 0 ] ; 
 	 	 	 r e t u r n   t r u e ; 
 	 	 } 
 	 } ) ; 
 	 
 	 i f   ( l a n g )   { 
 / /   	 	 c o n s o l e . l o g ( l a n g ) ; 
 	 	 r e t u r n   l a n g ; 
 	 } 
 	 
 	 r e t u r n   " e n " ; 
 } 
 
 f u n c t i o n   g e t _ m e d i a _ g r o u p s ( f i l e s )   { 
 	 f i l e s . f o r E a c h ( f i l e   = >   { 
 	 	 i f   ( i s _ m o v i e ( f i l e ) )   { 
 	 	 	 f i l e . c a t e g o r y   =   " m o v i e " ; 
 	 	 } 
 	 	 e l s e   i f   ( i s _ a u d i o ( f i l e ) )   { 
 	 	 	 f i l e . c a t e g o r y   =   " a u d i o " ; 
 	 	 } 
 	 	 e l s e   i f   ( i s _ i m a g e ( f i l e ) )   { 
 	 	 	 f i l e . c a t e g o r y   =   " i m a g e " ; 
 	 	 } 
 	 	 e l s e   i f   ( i s _ s u b t i t l e ( f i l e ) )   { 
 	 	 	 f i l e . c a t e g o r y   =   " s u b t i t l e " ; 
 	 	 } 
 	 	 e l s e   { 
 	 	 	 f i l e . c a t e g o r y   =   " u n k n o w n " ; 
 	 	 } 
 	 	 
 	 	 / /   T h e   c o n t a i n e r   i s   t h e   p a r e n t   f o l d e r 
 	 	 f i l e . c o n t a i n e r   =   f i l e . p a r e n t ; 
 	 	 	 	 
 	 	 / /   U n l e s s   t h e   p a r e n t   f o l d e r   i s   f o r   a   s e a s o n ,   i n   w h i c h   c a s e   t h e   c o n t a i n e r   i s   t h e   g r a n d p a r e n t 
 	 	 i f   ( f i l e . c o n t a i n e r . m a t c h ( / ^ S e a s o n   \ d + $ / g i ) )   { 
 	 	 	 f i l e . c o n t a i n e r   =   f i l e . p a t h [ f i l e . p a t h . l e n g t h   -   3 ] ; 
 	 	 	 f i l e . s u b c o n t a i n e r   =   f i l e . p a r e n t ; 
 	 	 } 
 	 } ) ; 
 	 
 	 v a r   m o v i e s         =   f i l e s . f i l t e r ( f i l e   = >   f i l e . c a t e g o r y   = =   " m o v i e " ) ; 
 	 v a r   s u b t i t l e s   =   f i l e s . f i l t e r ( f i l e   = >   f i l e . c a t e g o r y   = =   " s u b t i t l e " ) ; 
 	 v a r   i m a g e s         =   f i l e s . f i l t e r ( f i l e   = >   f i l e . c a t e g o r y   = =   " i m a g e " ) ; 
 
 	 m o v i e s . f o r E a c h ( m o v i e   = >   { 
 	 	 v a r   k e y   =   m o v i e . n a m e ; 
 	 	 v a r   p r e f i x   =   k e y   +   " . " ; 
 	 	 
 	 	 f u n c t i o n   i s _ m a t c h ( o t h e r )   { 
 	 	 	 r e t u r n   o t h e r . p a r e n t   = =   m o v i e . p a r e n t   & &   ( o t h e r . n a m e   = =   k e y   | |   o t h e r . n a m e . s t a r t s W i t h ( p r e f i x ) ) 
 	 	 } 
 	 	 
 	 	 f u n c t i o n   t a g ( o t h e r )   { 
 	 	 	 o t h e r . t a g   =   o t h e r . n a m e . s u b s t r ( p r e f i x . l e n g t h ) ; 
 	 	 	 o t h e r . l a n g   =   t a g 2 l a n g ( o t h e r . t a g ) ; 
 	 	 } 
 	 	 
 	 	 / /   T V   s h o w   f i l e   n a m e s   a r e   o f t e n   " T V   S h o w   -   0 1 - 0 1   E p i s o d e . m p 4 " 
 	 	 m o v i e . d i s p l a y _ n a m e   =   m o v i e . n a m e ; 
 	 	 v a r   n a m e _ p r e f i x   =   m o v i e . c o n t a i n e r   +   "   -   " ; 
 	 	 i f   ( m o v i e . d i s p l a y _ n a m e . s t a r t s W i t h ( n a m e _ p r e f i x ) )   { 
 	 	 	 m o v i e . d i s p l a y _ n a m e   =   m o v i e . d i s p l a y _ n a m e . s u b s t r ( n a m e _ p r e f i x . l e n g t h ) ; 
 	 	 } 
 	 	 
 	 	 m o v i e . s u b t i t l e s   =   s u b t i t l e s . f i l t e r ( i s _ m a t c h ) ; 
 	 	 m o v i e . s u b t i t l e s . f o r E a c h ( t a g ) ; 
 	 	 m o v i e . i m a g e s   =   i m a g e s . f i l t e r ( i s _ m a t c h ) ; 
 	 	 m o v i e . i m a g e s . f o r E a c h ( t a g ) ; 
 	 } ) ; 
 	 
 	 v a r   g r o u p s   =   m o v i e s . r e d u c e ( f u n c t i o n ( r e s u l t ,   o b j )   { 
 	 	 v a r   k e y   =   o b j . c o n t a i n e r   +   " / "   +   o b j . s u b c o n t a i n e r ; 
 	 	 v a r   g r o u p   =   r e s u l t [ k e y ]   | |   {   c o n t a i n e r :   o b j . c o n t a i n e r ,   s u b c o n t a i n e r :   o b j . s u b c o n t a i n e r ,   m o v i e s :   [ ]   } ; 
 	 	 r e s u l t [ k e y ]   =   g r o u p ; 
 	 	 
 	 	 g r o u p . m o v i e s   =   g r o u p . m o v i e s . c o n c a t ( o b j ) ; 
 	 	 
     	 	 r e t u r n   r e s u l t ; 
 	 } ,   { } ) ; 
 	 
 	 g r o u p s   =   O b j e c t . v a l u e s ( g r o u p s ) ; 
 	 
 	 g r o u p s . f o r E a c h ( g r o u p   = >   { 
 	 	 / * 
 	 	 A   g r o u p   i m a g e   h a s   t h e   s a m e   n a m e   a s   i t s   f o l d e r   o r   i t   i s   c a l l e d   " f o l d e r "   o r   " p o s t e r " 
 	 	 * / 
 	 	 f u n c t i o n   i s _ m a t c h ( o t h e r )   { 
 	 	 	 r e t u r n   o t h e r . c o n t a i n e r   = =   g r o u p . c o n t a i n e r   & &   o t h e r . s u b c o n t a i n e r   = =   g r o u p . s u b c o n t a i n e r   & & 
 	 	 	 	 ( ( o t h e r . n a m e   = =   o t h e r . p a r e n t )   | |   ( o t h e r . n a m e   = =   " f o l d e r " )   | |   ( o t h e r . n a m e   = =   " p o s t e r " ) ) ; 
 	 	 } 
 	 	 
 	 	 g r o u p . i m a g e s   =   i m a g e s . f i l t e r ( i s _ m a t c h ) ; 
 	 } ) ; 
 	 
 	 r e t u r n   g r o u p s ; 
 } 
 
 f u n c t i o n   m a i n ( )   { 
 	 v a r   s o u r c e   =   " / V o l u m e s / D i s k / v i d e o " ; 
 	 v a r   d e s t i n a t i o n   =   " / U s e r s / u s e r / D o c u m e n t s / m e d i a - t e s t / " ; 
 	 
 	 v a r   f i l e s   =   g e t _ f i l e s ( s o u r c e ) ; 
 	 w r i t e _ f i l e ( d e s t i n a t i o n   +     " f i l e s . t x t " ,   J S O N . s t r i n g i f y ( f i l e s   ,   n u l l ,   "         " ) ) ; 
 	 	 
 	 v a r   g r o u p s   =   g e t _ m e d i a _ g r o u p s ( f i l e s ) ; 
 	 w r i t e _ f i l e ( d e s t i n a t i o n   +   " g r o u p s . t x t " ,   J S O N . s t r i n g i f y ( g r o u p s ,   n u l l ,   "         " ) ) ; 
 } 
 
 m a i n ( ) ; 
 
   
   
   
   
                                4�jscr  ��ޭ